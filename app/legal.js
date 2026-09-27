// Shared layout for the legal pages (/personvern and /vilkar).
// Server component: plain HTML, no client JavaScript except a tiny script
// that applies the same light/dark choice the user picked in the app.

const css = `
:root { --bg:#FAF9F4; --card:#FFFFFF; --border:#E3DFD3; --ink:#1C2430; --body:#3A3F47; --muted:#75766E; --navy:#1E3A5F; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#12161C; --card:#1B212B; --border:#2B3340; --ink:#EDEFF3; --body:#D7DCE3; --muted:#96A0AF; --navy:#6E9BD6; } }
:root[data-theme="dark"] { --bg:#12161C; --card:#1B212B; --border:#2B3340; --ink:#EDEFF3; --body:#D7DCE3; --muted:#96A0AF; --navy:#6E9BD6; }
body { background: var(--bg); }
.legal { max-width: 720px; margin: 0 auto; padding: 28px 18px 60px; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--body); font-size: 15px; line-height: 1.65; }
.legal a { color: var(--navy); }
.legal h1 { font-family: ui-serif, Georgia, serif; color: var(--ink); font-size: 28px; line-height: 1.2; margin: 18px 0 4px; }
.legal h2 { font-family: ui-serif, Georgia, serif; color: var(--ink); font-size: 19px; margin: 28px 0 6px; }
.legal h3 { color: var(--ink); font-size: 15px; margin: 18px 0 4px; }
.legal p, .legal ul { margin: 0 0 10px; }
.legal ul { padding-left: 20px; }
.legal li { margin-bottom: 4px; }
.legal .meta { color: var(--muted); font-size: 13px; margin-bottom: 16px; }
.legal .box { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; margin: 14px 0; }
.legal .back { font-size: 13px; text-decoration: none; }
.legal .divider { border: 0; border-top: 1px solid var(--border); margin: 40px 0 8px; }
.legal table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 6px 0 12px; }
.legal th, .legal td { text-align: left; vertical-align: top; border-bottom: 1px solid var(--border); padding: 7px 8px 7px 0; }
.legal th { color: var(--ink); }
.legal .tablewrap { overflow-x: auto; }
`;

const themeScript = `try{var t=localStorage.getItem('dypdykk:theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}`;

export default function LegalPage({ title, updated, children }) {
  return (
    <main className="legal">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <a className="back" href="/">← Tilbake til NorskDive</a>
      <h1>{title}</h1>
      <div className="meta">
        Sist oppdatert: {updated} · <a href="#english">English version ↓</a>
      </div>
      {children}
      <hr className="divider" />
      <p className="meta">
        <a href="/personvern">Personvernerklæring</a> · <a href="/vilkar">Vilkår for bruk</a> · <a href="/">NorskDive</a>
      </p>
    </main>
  );
}
