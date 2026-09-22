"use client";

export default function Error({ reset }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
      <div style={{ maxWidth: 360 }}>
        <h2 style={{ margin: "0 0 8px" }}>Noe gikk galt</h2>
        <p style={{ margin: "0 0 16px", color: "#555" }}>
          Something went wrong. Your progress is saved.
        </p>
        <button onClick={() => reset()}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1e3a5f", color: "#fff", fontSize: 16, cursor: "pointer" }}>
          Prøv igjen
        </button>
      </div>
    </div>
  );
}
