// Edge Function „admin-invite”: invitații pentru utilizatori noi (doar administratori).
// Acțiuni (POST, JSON): { action: "invite", email, role? } · { action: "resend", user_id } · { action: "revoke", user_id }
// Cheia de serviciu există doar aici (variabilă de mediu a funcției), niciodată în aplicație.
import { createClient } from "npm:@supabase/supabase-js@2";

const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const MAX_PER_HOUR = 20;

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
  const action = body.action;
  // Linkul din email duce înapoi în aplicația din care a plecat cererea (Supabase îl acceptă doar dacă e în lista de adrese permise).
  const redirectTo = origin && /^(https:\/\/|http:\/\/localhost)/.test(origin) ? origin + "/" : undefined;

  // 2. Limită de ritm: cel mult 20 de emailuri pe oră pe administrator
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await service.from("invite_log").select("id", { count: "exact", head: true }).eq("admin_id", admin.id).gte("at", since);
  if ((count ?? 0) >= MAX_PER_HOUR && action !== "revoke") return reply(429, { error: "rate" });

  const log = (act: string, email: string, details: Record<string, unknown> = {}) =>
    service.from("invite_log").insert({ admin_id: admin.id, action: act, target_email: email, details });
  const lookup = async (args: Record<string, unknown>) => (await service.rpc("invite_lookup", args)).data as Record<string, unknown> | null;

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
    await log("invite", email, { role });
    return reply(200, { ok: true, user_id: data.user.id });
  }

  if (action === "resend" || action === "revoke") {
    const id = String(body.user_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "bad_request" });
    const u = await lookup({ p_user_id: id });
    if (u?.state !== "pending") return reply(409, { error: "not_pending" });
    const email = String(u.email);

    if (action === "revoke") {
      const { error } = await service.auth.admin.deleteUser(id);
      if (error) return reply(500, { error: "delete" });
      await log("revoke", email);
      return reply(200, { ok: true });
    }
    // Cine a deschis deja linkul are contul confirmat: primește un link de resetare a parolei în loc de invitație.
    const sent = u.confirmed
      ? await service.auth.resetPasswordForEmail(email, { redirectTo })
      : await service.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (sent.error) return reply(502, { error: "email", detail: sent.error.message });
    await log("resend", email, { confirmed: !!u.confirmed });
    return reply(200, { ok: true });
  }

  return reply(400, { error: "bad_request" });
});
