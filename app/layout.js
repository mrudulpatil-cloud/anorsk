import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "NorskDive — Norsk for Norskprøven",
  description: "Norwegian exam prep for Norskprøven, covering reading, listening, writing, and speaking across CEFR A1–B2.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="no">
      <body style={{ margin: 0 }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
