// Receives feedback from the home-page form and forwards it to the Google
// Apps Script web app that writes to the feedback Sheet. Keeping this hop on
// the server means the script URL and shared secret never reach the browser.
//
// Required Vercel environment variables:
//   FEEDBACK_SCRIPT_URL  – the Apps Script "Web app" URL (ends in /exec)
//   FEEDBACK_SECRET      – same random string as SECRET in the Apps Script
//
// No IP address or browser data is forwarded or stored.

const TYPES = new Set(["forslag", "feil", "funksjon", "annet"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function reply(body, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request) {
  const url = process.env.FEEDBACK_SCRIPT_URL;
  const secret = process.env.FEEDBACK_SECRET;
  if (!url || !secret) return reply({ ok: false, error: "not-configured" }, 503);

  let data;
  try {
    data = await request.json();
  } catch {
    return reply({ ok: false, error: "bad-request" }, 400);
  }

  // Honeypot filled in: pretend success so bots learn nothing.
  if (data.website) return reply({ ok: true });

  const type = TYPES.has(data.type) ? data.type : "annet";
  const message = typeof data.message === "string" ? data.message.trim().slice(0, 2000) : "";
  const email = typeof data.email === "string" ? data.email.trim().slice(0, 200) : "";
  const pair = typeof data.pair === "string" ? data.pair.slice(0, 10) : "";

  if (message.length < 3) return reply({ ok: false, error: "empty" }, 400);
  if (email && (!EMAIL_RE.test(email) || data.consent !== true)) {
    return reply({ ok: false, error: "email" }, 400);
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, type, message, email, pair }),
      redirect: "follow",
      cache: "no-store",
    });
    const text = await res.text();
    let out = null;
    try { out = JSON.parse(text); } catch {}
    if (!res.ok || !out || !out.ok) {
      console.error("feedback upstream failed", res.status, new URL(res.url).host, text.slice(0, 300));
      return reply({ ok: false, error: "upstream" }, 502);
    }
    return reply({ ok: true });
  } catch (err) {
    console.error("feedback upstream error", err && err.message);
    return reply({ ok: false, error: "upstream" }, 502);
  }
}
