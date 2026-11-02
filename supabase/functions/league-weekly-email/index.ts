// Edge Function „league-weekly-email”: emailul de luni cu rezultatele ligii, către toți participanții.
// Apelată de pg_cron (luni 07:00 și 08:00 UTC) cu antetul x-cron-secret (secretul „league_mail_cron” din Vault).
// Body (JSON): {mode: "send" | "dry" | "test", week?: "YYYY-MM-DD", to?: "adresa", force?: true}
//   send (implicit): trimite doar luni la ora 9 din Europe/Berlin (CET/CEST), fiecărui participant care nu a primit deja săptămâna respectivă
//   dry: nu trimite nimic; întoarce numărul de destinatari și un exemplu de mesaj (fără verificarea orei)
//   test: trimite un singur mesaj de probă la „to” (cu primul rând real sau cu date de exemplu); nu scrie în jurnal
// Variabile de mediu (Supabase → Edge Functions → Secrets): BREVO_API_KEY, MAIL_FROM, MAIL_FROM_NAME (opțional).
import { createClient } from "npm:@supabase/supabase-js@2";

const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SITE = "https://deutschplatform.vercel.app";
const TIERS = ["🌱 A1 Anfänger", "🧭 A2 Entdecker", "🏅 B1 Profi", "👑 B2 Meister"];
const MONTHS = ["ian", "feb", "mar", "apr", "mai", "iun", "iul", "aug", "sep", "oct", "nov", "dec"];
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

type Row = {
  user_id: string; email: string; name: string | null; first_name: string | null;
  tier: number; place: number; size: number; xp: number; outcome: string; new_tier: number;
  podium: { place: number; name: string | null; avatar: string | null; xp: number }[];
};

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const tierName = (n: number) => TIERS[n - 1] ?? "";

function weekRange(weekStart: string): string {
  const a = new Date(weekStart + "T12:00:00Z"), b = new Date(a.getTime() + 6 * 86400000);
  const f = (d: Date) => d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
  return f(a) + " – " + f(b);
}

// Titlul și mesajul de felicitare, după rezultatul săptămânii
function message(r: Row): [string, string] {
  const place = "locul " + r.place + " din " + r.size + " în " + tierName(r.tier);
  if (r.outcome === "promoted") return ["🎉 Felicitări! Ai urcat în " + tierName(r.new_tier), "Ai încheiat săptămâna pe " + place + " și ai fost promovat. Bravo pentru efort!"];
  if (r.outcome === "demoted") return ["Felicitări că ai continuat!", "Ai încheiat pe " + place + ", iar săptămâna aceasta pornești în " + tierName(r.new_tier) + ". O săptămână bună te readuce sus, iar punctele strânse până acum rămân ale tale."];
  if (r.outcome === "inactive") return ["Felicitări că faci parte din ligă!", "Săptămâna trecută a fost mai liniștită (" + r.xp + " XP, sub pragul de 50 XP, deci rămâi în " + tierName(r.tier) + "). O săptămână nouă tocmai a început: câteva minute pe zi fac diferența."];
  return ["Felicitări pentru săptămâna ta!", "Ai încheiat pe " + place + " și rămâi acolo. Fiecare răspuns corect te apropie de promovare."];
}

export function render(r: Row, weekStart: string): { subject: string; html: string } {
  const [title, text] = message(r);
  const who = r.first_name || r.name || "";
  const podium = r.podium.length
    ? '<p style="margin:20px 0 6px;font-weight:700">Podiumul grupei tale</p><table role="presentation" style="border-collapse:collapse;width:100%">' +
      r.podium.map((p) => '<tr><td style="padding:6px 8px;border-bottom:1px solid #e3e9ec;width:36px">' + (["🥇", "🥈", "🥉"][p.place - 1] ?? p.place) + "</td><td style=\"padding:6px 8px;border-bottom:1px solid #e3e9ec\">" +
        esc(p.avatar) + " " + esc(p.name) + '</td><td style="padding:6px 8px;border-bottom:1px solid #e3e9ec;text-align:right;font-weight:700">' + p.xp + " XP</td></tr>").join("") + "</table>"
    : "";
  const html = '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#173139;line-height:1.5">' +
    '<h2 style="margin:0 0 4px">' + esc(title) + "</h2>" +
    '<p style="margin:0 0 16px;color:#61737a;font-size:14px">Rezultatele ligii · săptămâna ' + esc(weekRange(weekStart)) + "</p>" +
    "<p>Salut" + (who ? ", " + esc(who) : "") + "!</p>" +
    "<p>" + esc(text) + "</p>" +
    '<table role="presentation" style="border-collapse:collapse;width:100%;margin:16px 0"><tr>' +
    '<td style="padding:12px;background:#eef4f6;border-radius:10px;text-align:center"><div style="font-size:24px;font-weight:700">' + r.xp + '</div><div style="font-size:13px;color:#61737a">XP în săptămână</div></td>' +
    '<td style="width:10px"></td>' +
    '<td style="padding:12px;background:#eef4f6;border-radius:10px;text-align:center"><div style="font-size:24px;font-weight:700">' + r.place + "/" + r.size + '</div><div style="font-size:13px;color:#61737a">locul în grupă</div></td>' +
    "</tr></table>" + podium +
    '<p style="margin:24px 0"><a href="' + SITE + '" style="display:inline-block;padding:12px 22px;background:#173139;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:700">Deschide platforma</a></p>' +
    '<p style="color:#61737a;font-size:13px">Primești acest email pentru că ești înscris la provocarea săptămânală (liga). Dacă nu mai vrei să-l primești, te poți retrage din ligă în aplicație, la cardul „Liga ta” → „Retrage-te”.</p></div>';
  return { subject: "Rezultatele ligii · " + weekRange(weekStart), html };
}

async function sendMail(to: string, toName: string | null, subject: string, html: string): Promise<string | null> {
  const key = Deno.env.get("BREVO_API_KEY"), from = Deno.env.get("MAIL_FROM");
  if (!key || !from) return "config:" + (!key ? " BREVO_API_KEY" : "") + (!from ? " MAIL_FROM" : "") + " lipsește";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: from, name: Deno.env.get("MAIL_FROM_NAME") ?? "Deutsch · antrenament" },
      to: [toName ? { email: to, name: toName } : { email: to }],
      subject, htmlContent: html,
    }),
  });
  const text = await res.text();
  if (!res.ok) return "brevo " + res.status + " " + text.slice(0, 200);
  lastMessageId = text.slice(0, 200);
  return null;
}
let lastMessageId = "";

// Ora din Berlin acum: ziua săptămânii și ora (se ține cont automat de ora de vară)
function berlinNow(): { weekday: string; hour: number } {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date());
  return { weekday: p.find((x) => x.type === "weekday")!.value, hour: Number(p.find((x) => x.type === "hour")!.value) };
}

Deno.serve(async (req) => {
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  if (req.method !== "POST") return reply(405, { error: "method" });

  const secret = req.headers.get("x-cron-secret") ?? "";
  const { data: ok } = await service.rpc("league_mail_auth", { p_secret: secret });
  if (ok !== true) return reply(401, { error: "auth" });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* corp gol = send */ }
  const mode = String(body.mode ?? "send");
  if (!["send", "dry", "test"].includes(mode)) return reply(400, { error: "mode" });
  const week = body.week ? String(body.week) : null;
  if (week && !/^\d{4}-\d{2}-\d{2}$/.test(week)) return reply(400, { error: "week" });

  if (mode === "send" && body.force !== true) {
    const n = berlinNow();
    if (n.weekday !== "Mon" || n.hour !== 9) return reply(200, { skipped: "not Monday 09:00 Europe/Berlin", berlin: n });
  }

  const { data: batch, error } = await service.rpc("league_mail_batch", { p_week: week });
  if (error || !batch) return reply(500, { error: "batch", detail: error?.message });
  const weekStart: string | null = batch.week_start;
  const rows: Row[] = batch.rows ?? [];
  if (!weekStart) return reply(200, { sent: 0, note: "no closed week yet" });

  if (mode === "dry") {
    const sample = rows[0] ? render(rows[0], weekStart) : null;
    return reply(200, { week_start: weekStart, recipients: rows.length, sample });
  }

  if (mode === "test") {
    const to = String(body.to ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(to)) return reply(400, { error: "to" });
    const r: Row = rows[0] ?? { user_id: "", email: to, name: "Exemplu", first_name: "Exemplu", tier: 1, place: 2, size: 8, xp: 240, outcome: "stayed", new_tier: 1,
      podium: [{ place: 1, name: "Ana", avatar: "🦊", xp: 410 }, { place: 2, name: "Exemplu", avatar: "🐼", xp: 240 }, { place: 3, name: "Dan", avatar: "🦉", xp: 190 }] };
    const m = render(r, weekStart);
    const err = await sendMail(to, null, "[PROBĂ] " + m.subject, m.html);
    return err ? reply(502, { error: err }) : reply(200, { sent: 1, to, from: Deno.env.get("MAIL_FROM"), brevo: lastMessageId });
  }

  // send: pe rând, cu înregistrare în jurnal; un eșec nu oprește ceilalți
  let sent = 0, failed = 0;
  for (const r of rows) {
    const m = render(r, weekStart);
    const err = await sendMail(r.email, r.name, m.subject, m.html);
    if (err?.startsWith("config")) return reply(500, { error: err, sent, failed });
    await service.from("league_email_log").upsert(
      { week_start: weekStart, user_id: r.user_id, status: err ? "failed" : "sent", error: err, sent_at: new Date().toISOString() },
      { onConflict: "week_start,user_id" });
    err ? failed++ : sent++;
  }
  return reply(200, { week_start: weekStart, sent, failed });
});
