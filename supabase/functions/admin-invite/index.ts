// Edge Function „admin-invite”: invitații și gestionarea conturilor (doar administratori).
// Acțiuni (POST, JSON):
//   invite {email, role?} · resend {user_id} · revoke {user_id}
//   set_role {user_id, role} · disable {user_id} · enable {user_id} · reset_password {user_id} · delete {user_id, confirm_email}
// Cheia de serviciu există doar aici (variabilă de mediu a funcției), niciodată în aplicație.
import { createClient } from "npm:@supabase/supabase-js@2";

const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const MAX_EMAILS_PER_HOUR = 20;
const SENDS_EMAIL = ["invite", "resend", "reset_password"];
const BAN_FOREVER = "876000h"; // ~100 de ani

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return reply(405, { error: "method" });

  // 1. Cine apelează și este administrator? (rolul se citește de pe server, nu din cerere)
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth, error: authError } = await service.auth.getUser(token);
  if (authError || !auth?.user) return reply(401, { error: "auth" });
  const admin = auth.user;
  const { data: me } = await service.from("profiles").select("role").eq("user_id", admin.id).maybeSingle();
  if (me?.role !== "admin") return reply(403, { error: "forbidden" });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "bad_request" });
  }
  const action = String(body.action ?? "");
  // Linkul din email duce înapoi în aplicația din care a plecat cererea (Supabase îl acceptă doar dacă e în lista de adrese permise).
  const redirectTo = origin && /^(https:\/\/|http:\/\/localhost)/.test(origin) ? origin + "/" : undefined;

  // 2. Limită de ritm pentru emailuri: cel mult 20 pe oră pe administrator
  if (SENDS_EMAIL.includes(action)) {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await service.from("admin_audit").select("id", { count: "exact", head: true })
      .eq("admin_id", admin.id).in("action", SENDS_EMAIL).gte("at", since);
    if ((count ?? 0) >= MAX_EMAILS_PER_HOUR) return reply(429, { error: "rate" });
  }

  const log = (act: string, email: string, details: Record<string, unknown> = {}, targetId?: string) =>
    service.from("admin_audit").insert({ admin_id: admin.id, action: act, target_email: email, details, target_user_id: targetId ?? null });
  const lookup = async (args: Record<string, unknown>) => (await service.rpc("invite_lookup", args)).data as Record<string, unknown> | null;
  const otherActiveAdmins = async (exclude: string) => Number((await service.rpc("admin_active_admins", { p_exclude: exclude })).data ?? 0);

  if (action === "invite") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = body.role === "admin" ? "admin" : "user";
    if (email.length > 254 || !EMAIL_RE.test(email)) return reply(400, { error: "email" });
    const before = await lookup({ p_email: email });
    if (before?.state === "exists") return reply(409, { error: "exists" });
    if (before?.state === "pending") return reply(409, { error: "pending", user_id: before.user_id });

    const { data, error } = await service.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (error || !data?.user) {
      // Dacă invitația a creat contul dar emailul nu a plecat, nu lăsăm un cont orfan.
      const after = await lookup({ p_email: email });
      if (after?.state === "pending") await service.auth.admin.deleteUser(String(after.user_id));
      const m = String(error?.message ?? "").toLowerCase();
      if (m.includes("already") || m.includes("registered")) return reply(409, { error: "exists" });
      return reply(502, { error: "email", detail: error?.message ?? "unknown" });
    }
    const { error: pe } = await service.from("profiles").upsert({ user_id: data.user.id, role, invited_by: admin.id }, { onConflict: "user_id" });
    if (pe) {
      await service.auth.admin.deleteUser(data.user.id);
      return reply(500, { error: "profile" });
    }
    await log("invite", email, { role }, data.user.id);
    return reply(200, { ok: true, user_id: data.user.id });
  }

  const managed = ["resend", "revoke", "set_role", "disable", "enable", "reset_password", "delete"];
  if (!managed.includes(action)) return reply(400, { error: "bad_request" });

  const id = String(body.user_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "bad_request" });
  const u = await lookup({ p_user_id: id });
  if (!u || u.state === "none") return reply(404, { error: "not_found" });
  const email = String(u.email);
  const pending = u.state === "pending";
  const isSelf = id === admin.id;
  const targetIsActiveAdmin = u.role === "admin" && !u.banned && !pending;

  if (action === "resend" || action === "revoke") {
    if (!pending) return reply(409, { error: "not_pending" });
    if (action === "revoke") {
      const { error } = await service.auth.admin.deleteUser(id);
      if (error) return reply(500, { error: "delete" });
      await log("revoke", email, {}, id);
      return reply(200, { ok: true });
    }
    // Cine a deschis deja linkul are contul confirmat: primește un link de resetare a parolei în loc de invitație.
    const sent = u.confirmed
      ? await service.auth.resetPasswordForEmail(email, { redirectTo })
      : await service.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (sent.error) return reply(502, { error: "email", detail: sent.error.message });
    await log("resend", email, { confirmed: !!u.confirmed }, id);
    return reply(200, { ok: true });
  }

  // Acțiunile următoare se aplică doar conturilor înregistrate; invitațiile se gestionează cu „Retrimite” / „Anulează”.
  if (pending) return reply(409, { error: "is_pending" });

  if (action === "set_role") {
    const role = body.role === "admin" ? "admin" : body.role === "user" ? "user" : null;
    if (!role) return reply(400, { error: "bad_request" });
    if (u.role === role) return reply(200, { ok: true, unchanged: true });
    if (role === "user" && targetIsActiveAdmin && (await otherActiveAdmins(id)) < 1) return reply(409, { error: "last_admin" });
    const { error } = await service.from("profiles").upsert({ user_id: id, role }, { onConflict: "user_id" });
    if (error) return reply(500, { error: "profile" });
    await log("set_role", email, { from: u.role, to: role }, id);
    return reply(200, { ok: true });
  }

  if (action === "disable" || action === "enable") {
    if (isSelf) return reply(409, { error: "self" });
    if (action === "disable" && targetIsActiveAdmin && (await otherActiveAdmins(id)) < 1) return reply(409, { error: "last_admin" });
    const { error } = await service.auth.admin.updateUserById(id, { ban_duration: action === "disable" ? BAN_FOREVER : "none" });
    if (error) return reply(500, { error: "ban" });
    await log(action, email, {}, id);
    return reply(200, { ok: true });
  }

  if (action === "reset_password") {
    const { error } = await service.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return reply(502, { error: "email", detail: error.message });
    await log("reset_password", email, {}, id);
    return reply(200, { ok: true });
  }

  // delete: ștergere definitivă, cu emailul tastat drept confirmare
  if (isSelf) return reply(409, { error: "self" });
  if (String(body.confirm_email ?? "").trim().toLowerCase() !== email.toLowerCase()) return reply(400, { error: "confirm_mismatch" });
  if (targetIsActiveAdmin && (await otherActiveAdmins(id)) < 1) return reply(409, { error: "last_admin" });
  const { error } = await service.auth.admin.deleteUser(id);
  if (error) return reply(500, { error: "delete" });
  await log("delete", email, { role: u.role }, id);
  return reply(200, { ok: true });
});
