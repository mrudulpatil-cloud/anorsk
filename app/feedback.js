// test
  indented
}"use client";
import React, { useState } from "react";
import { Check, MessageCircle } from "lucide-react";

// Feedback form on the home page. Posts to /api/feedback (our own server
// route), which forwards to a Google Apps Script that appends a row to the
// feedback Sheet owned by sprakanorsk@gmail.com. The script URL and secret
// live only in Vercel environment variables, never in the browser.
//
// Privacy: email is optional and only used to reply. The palette object C
// is passed in from dypdykk.js so the form follows light/dark mode.

const TYPES = [
  { id: "forslag", label: "Forslag" },
  { id: "feil", label: "Feil / noe virker ikke" },
  { id: "funksjon", label: "Ønsket funksjon" },
  { id: "annet", label: "Annet" },
];

const MAX_MESSAGE = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function FeedbackForm({ C, pair = "" }) {
  const [type, setType] = useState("forslag");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot: humans never see or fill this
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorText, setErrorText] = useState("");

  const trimmedEmail = email.trim();
  const emailGiven = trimmedEmail.length > 0;
  const emailValid = !emailGiven || EMAIL_RE.test(trimmedEmail);
  const canSend =
    message.trim().length >= 3 &&
    message.length <= MAX_MESSAGE &&
    emailValid &&
    (!emailGiven || consent) &&
    status !== "sending";

  async function submit(e) {
    e.preventDefault();
    if (!canSend) return;
    setStatus("sending");
    setErrorText("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          email: emailGiven ? trimmedEmail : "",
          consent: emailGiven ? consent : false,
          pair,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "send-failed");
      setStatus("sent");
      setMessage("");
      setEmail("");
      setConsent(false);
    } catch (err) {
      setStatus("error");
      setErrorText(
        err.message === "not-configured"
          ? "Tilbakemeldinger er ikke slått på ennå. Prøv igjen senere."
          : "Noe gikk galt, og meldingen ble ikke sendt. Prøv igjen om litt."
      );
    }
  }

  const input = {
    width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "10px 12px", fontSize: 14, fontFamily: "inherit", background: C.card, color: C.ink,
  };
  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 };

  if (status === "sent") {
    return (
      <div style={{ ...card, padding: "16px", fontSize: 13.5, lineHeight: 1.6, color: C.body }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.green, marginBottom: 4 }}>
          <Check size={16} /> Takk! Meldingen er sendt.
        </div>
        <div>Jeg leser alt som kommer inn, selv om jeg ikke kan svare på alt.</div>
        <button
          onClick={() => setStatus("idle")}
          style={{ marginTop: 10, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12.5, color: C.navy, fontWeight: 600, cursor: "pointer" }}
        >
          Send en melding til
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ ...card, padding: "14px 16px" }} noValidate>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.ink, fontSize: 14, marginBottom: 4 }}>
        <MessageCircle size={16} color={C.navy} /> Hva kan bli bedre?
      </div>
      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.55, marginBottom: 12 }}>
        Forslag, feil du har funnet, eller noe du savner. <span lang="en">Suggestions, bugs, or features you'd like — English is fine too.</span>
      </div>

      <div role="radiogroup" aria-label="Type tilbakemelding" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {TYPES.map((t) => {
          const active = type === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setType(t.id)}
              style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? C.navy : C.border}`, background: active ? C.navy : "transparent", color: active ? C.bg : C.ink, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <label htmlFor="fb-message" style={{ position: "absolute", left: -9999 }}>Melding</label>
      <textarea
        id="fb-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Skriv meldingen din her ..."
        rows={5}
        maxLength={MAX_MESSAGE}
        required
        style={{ ...input, resize: "vertical" }}
      />
      <div style={{ fontSize: 11, color: message.length > MAX_MESSAGE * 0.9 ? C.red : C.muted, textAlign: "right", marginTop: 3 }}>
        {message.length} / {MAX_MESSAGE}
      </div>

      <label htmlFor="fb-email" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.ink, margin: "8px 0 4px" }}>
        E-post <span style={{ fontWeight: 400, color: C.muted }}>(valgfritt, bare hvis du vil ha svar)</span>
      </label>
      <input
        id="fb-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="navn@eksempel.no"
        style={{ ...input, borderColor: emailValid ? C.border : C.red }}
      />
      {!emailValid && <div style={{ fontSize: 11.5, color: C.red, marginTop: 4 }}>Sjekk at e-postadressen er riktig.</div>}

      {emailGiven && (
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: C.body, lineHeight: 1.5, marginTop: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
          <span>Jeg godtar at NorskDive lagrer e-posten min for å svare på denne meldingen.</span>
        </label>
      )}

      {/* Honeypot for spam bots — hidden from people and screen readers */}
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>
        <label>Ikke fyll ut dette feltet<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>

      <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.6, marginTop: 12 }}>
        Personvern: Meldingen lagres i et privat regneark som bare NorskDive har tilgang til. Oppgir du e-post, brukes den
        bare til å svare deg, deles ikke med noen og slettes senest 12 måneder etter siste kontakt. Du kan når som helst be
        om innsyn eller sletting på{" "}
        <a href="mailto:sprakanorsk@gmail.com" style={{ color: C.navy }}>sprakanorsk@gmail.com</a>.
        <span lang="en"> Email is optional and only used to reply; ask for deletion at any time.</span>
      </div>

      {status === "error" && (
        <div role="alert" style={{ fontSize: 12.5, color: C.red, background: C.redBg, borderRadius: 8, padding: "8px 10px", marginTop: 10 }}>
          {errorText}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button
          type="submit"
          disabled={!canSend}
          style={{ background: canSend ? C.navy : C.border, color: canSend ? C.bg : C.muted, border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: canSend ? "pointer" : "default" }}
        >
          {status === "sending" ? "Sender ..." : "Send tilbakemelding"}
        </button>
      </div>
    </form>
  );
}
