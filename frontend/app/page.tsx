"use client";
import { useState } from "react";
import { request } from "../lib/api";

const DEMO_EMAIL = "demo@the-one-saas.app";
const DEMO_PASSWORD = "demo1234";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  async function run(_label: string, fn: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    try {
      await fn();
    } catch (e: any) {
      setStatus(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.5, fontSize: 12, margin: 0 }}>FanzoftheOne</p>
        {demoMode && (
          <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid #166534", background: "#052e16", color: "#4ade80" }}>
            Demo mode
          </span>
        )}
      </div>
      <h1 style={{ marginTop: 8 }}>The One SaaS</h1>
      <p style={{ opacity: 0.7 }}>Register, login, and run the AI execute endpoint — or try the demo in one tap.</p>

      <button
        disabled={busy}
        onClick={() =>
          run("demo", async () => {
            const res = await request("/demo", { method: "POST" });
            setEmail(res.email);
            setPassword(res.password);
            setToken(res.token);
            setDemoMode(true);
            setStatus(JSON.stringify(res.execute, null, 2));
          })
        }
        style={{
          marginTop: 20,
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #fbbf24",
          background: "linear-gradient(180deg,#f59e0b,#d97706)",
          color: "#111",
          fontWeight: 800,
        }}
      >
        Try demo mode
      </button>
      <p style={{ marginTop: 8, fontSize: 12, opacity: 0.55 }}>
        Uses {DEMO_EMAIL} / {DEMO_PASSWORD} — no signup required.
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setDemoMode(false); }}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff" }}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setDemoMode(false); }}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff" }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button
          disabled={busy}
          onClick={() =>
            run("register", async () => {
              await request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
              setDemoMode(false);
              setStatus("Registered");
            })
          }
          style={{ padding: "10px 14px", borderRadius: 8, border: 0, background: "#fff", color: "#000", fontWeight: 700 }}
        >
          Register
        </button>
        <button
          disabled={busy}
          onClick={() =>
            run("login", async () => {
              const res = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
              setToken(res.token);
              setDemoMode(email.trim().toLowerCase() === DEMO_EMAIL);
              setStatus("Logged in");
            })
          }
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}
        >
          Login
        </button>
        <button
          disabled={busy || !token}
          onClick={() =>
            run("execute", async () => {
              const res = await request("/execute?token=" + encodeURIComponent(token), { method: "POST" });
              setStatus(JSON.stringify(res, null, 2));
            })
          }
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #444", background: token ? "#166534" : "#222", color: "#fff" }}
        >
          Run AI
        </button>
      </div>

      {token && <p style={{ marginTop: 16, fontSize: 12, opacity: 0.5, wordBreak: "break-all" }}>token set{demoMode ? " · demo" : ""}</p>}
      {status && (
        <pre style={{ marginTop: 16, padding: 12, background: "#111", borderRadius: 8, border: "1px solid #333", whiteSpace: "pre-wrap" }}>
          {status}
        </pre>
      )}
    </main>
  );
}
