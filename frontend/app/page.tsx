"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { request } from "../lib/api";

const DEMO_EMAIL = "demo@the-one-saas.app";
const DEMO_PASSWORD = "demo1234";

type Tab = "home" | "pricing" | "modules" | "command" | "flow" | "pulse";

type OfferTier = {
  key: string;
  setup_fee: number;
  monthly_fee: number;
  includes: string[];
};

type ModuleItem = {
  name: string;
  price: number;
  vertical: string;
  installed: boolean;
  blurb: string;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "pricing", label: "Pricing" },
  { id: "modules", label: "Modules" },
  { id: "command", label: "Command" },
  { id: "flow", label: "Flow" },
  { id: "pulse", label: "Pulse" },
];

const inputStyle: Record<string, string | number> = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  width: "100%",
  boxSizing: "border-box",
};

const cardStyle: Record<string, string | number> = {
  padding: 16,
  borderRadius: 12,
  border: "1px solid #1f2937",
  background: "#111827",
};

function money(n: number) {
  return `$${Number(n).toLocaleString()}`;
}

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [brand, setBrand] = useState("FanzSpot Labs");
  const [offers, setOffers] = useState<OfferTier[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [flow, setFlow] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const loadProduct = useCallback(async () => {
    try {
      const [w, o, m, f, a] = await Promise.all([
        request("/whitelabel"),
        request("/offers"),
        request("/modules"),
        request("/flow"),
        request("/analytics"),
      ]);
      if (w?.brand_alias) setBrand(w.brand_alias);
      setOffers(o?.tiers || []);
      setModules(m?.modules || []);
      setFlow(f);
      setAnalytics(a);
    } catch (e: any) {
      setStatus(e.message || String(e));
    }
  }, []);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

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

  const smoke = flow?.smokescreen;
  const sample = analytics?.sample_weekly || {};

  const nav = useMemo(
    () => (
      <nav
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: active ? "1px solid #38bdf8" : "1px solid #334155",
                background: active ? "#0c4a6e" : "#0f172a",
                color: active ? "#e0f2fe" : "#cbd5e1",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    ),
    [tab]
  );

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 48px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <p style={{ letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5, fontSize: 11, margin: 0 }}>
            {brand}
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: 28 }}>The One SaaS</h1>
        </div>
        {demoMode && (
          <span
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #166534",
              background: "#052e16",
              color: "#4ade80",
              whiteSpace: "nowrap",
            }}
          >
            Demo
          </span>
        )}
      </header>

      {nav}

      {tab === "home" && (
        <section style={{ marginTop: 16, display: "grid", gap: 14 }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>
              {smoke?.headline || "FanzSpot Labs: multi-vertical operating system"}
            </h2>
            <p style={{ opacity: 0.8, lineHeight: 1.5, marginBottom: 0 }}>
              {smoke?.category_story ||
                "FanzSpot Labs helps multi-vertical teams deploy AI-enabled operations acceleration with a repeatable white-label model."}
            </p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: 15, opacity: 0.7 }}>Credibility</h3>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, opacity: 0.9 }}>
              {(smoke?.credibility_angles || [
                "Built from real deployments, not slideware.",
                "Fast onboarding path with measurable weekly outcomes.",
                "Compounding improvements across sales, delivery, and retention.",
              ]).map((a: string) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                  setTab("command");
                })
              }
              style={{
                flex: "1 1 160px",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #fbbf24",
                background: "linear-gradient(180deg,#f59e0b,#d97706)",
                color: "#111",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Try demo
            </button>
            <button
              type="button"
              onClick={() => setTab("pricing")}
              style={{
                flex: "1 1 160px",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "#1e293b",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View Pricing
            </button>
          </div>
          <p style={{ fontSize: 12, opacity: 0.55, margin: 0 }}>
            Proof script: {smoke?.proof_script || "Show current workflow, show automated workflow, show measurable delta in 7-14 days."}
          </p>
        </section>
      )}

      {tab === "pricing" && (
        <section style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <p style={{ opacity: 0.7, margin: 0 }}>Starter / Growth / Premium from the live offer stack.</p>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {offers.map((tier) => (
              <div key={tier.key} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.55 }}>
                  {tier.key}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{money(tier.monthly_fee)}<span style={{ fontSize: 13, fontWeight: 500, opacity: 0.6 }}>/mo</span></div>
                <div style={{ fontSize: 13, opacity: 0.65 }}>Setup {money(tier.setup_fee)}</div>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.55, opacity: 0.85 }}>
                  {tier.includes.map((inc) => (
                    <li key={inc}>{titleCase(inc)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {!offers.length && <p style={{ opacity: 0.6 }}>Loading offers…</p>}
        </section>
      )}

      {tab === "modules" && (
        <section style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <p style={{ opacity: 0.7, margin: 0 }}>White-label verticals from THE ONE Layer 3 — install toggles persist in-session.</p>
          {modules.map((m) => (
            <div
              key={m.name}
              style={{
                ...cardStyle,
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 220px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <strong>{m.name}</strong>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#0f172a", border: "1px solid #334155", color: "#94a3b8" }}>
                    {m.vertical}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.75, lineHeight: 1.45 }}>{m.blurb}</p>
                <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.55 }}>{money(m.price)}/mo</p>
              </div>
              <button
                disabled={busy}
                onClick={() =>
                  run("install", async () => {
                    const res = await request("/modules/install", {
                      method: "POST",
                      body: JSON.stringify({ name: m.name, token: token || undefined }),
                    });
                    setModules(res.modules || []);
                    setStatus(`${res.module?.name} → ${res.module?.installed ? "Installed" : "Uninstalled"}`);
                  })
                }
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: m.installed ? "1px solid #166534" : "1px solid #444",
                  background: m.installed ? "#052e16" : "#1a1a1a",
                  color: m.installed ? "#4ade80" : "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {m.installed ? "Installed" : "Install"}
              </button>
            </div>
          ))}
          {!modules.length && <p style={{ opacity: 0.6 }}>Loading modules…</p>}
        </section>
      )}

      {tab === "command" && (
        <section style={{ marginTop: 16 }}>
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
              marginTop: 8,
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #fbbf24",
              background: "linear-gradient(180deg,#f59e0b,#d97706)",
              color: "#111",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Try demo mode
          </button>
          <p style={{ marginTop: 8, fontSize: 12, opacity: 0.55 }}>
            Uses {DEMO_EMAIL} / {DEMO_PASSWORD} — no signup required.
          </p>

          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            <input
              placeholder="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setDemoMode(false);
              }}
              style={inputStyle}
            />
            <input
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setDemoMode(false);
              }}
              style={inputStyle}
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
              style={{ padding: "10px 14px", borderRadius: 8, border: 0, background: "#fff", color: "#000", fontWeight: 700, cursor: "pointer" }}
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
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #444", background: "#1a1a1a", color: "#fff", cursor: "pointer" }}
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
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #444",
                background: token ? "#166534" : "#222",
                color: "#fff",
                cursor: token ? "pointer" : "not-allowed",
              }}
            >
              Run AI
            </button>
          </div>

          {token && (
            <p style={{ marginTop: 16, fontSize: 12, opacity: 0.5, wordBreak: "break-all" }}>
              token set{demoMode ? " · demo" : ""}
            </p>
          )}
        </section>
      )}

      {tab === "flow" && (
        <section style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Index of Flow</h3>
            <p style={{ opacity: 0.7, fontSize: 13, marginTop: 0 }}>
              {flow?.objective || "Propagate high-value product systems across the portfolio"}
            </p>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
              {(flow?.value_loop || []).map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Proof of Value Loop</h3>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
              {(flow?.proof_of_value?.weekly_cycle || []).map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <h4 style={{ marginBottom: 6, marginTop: 16, fontSize: 13, opacity: 0.65 }}>Required proof assets</h4>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.55, fontSize: 13, opacity: 0.85 }}>
              {(flow?.proof_of_value?.required_proof_assets || []).map((a: string) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          {!flow && <p style={{ opacity: 0.6 }}>Loading flow…</p>}
        </section>
      )}

      {tab === "pulse" && (
        <section style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.55 }}>North star</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
              {titleCase(analytics?.north_star_metric || "weekly_value_created")}
            </div>
            <div style={{ marginTop: 8, fontSize: 32, fontWeight: 800, color: "#38bdf8" }}>
              {sample.weekly_value_created != null ? money(sample.weekly_value_created) : "—"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>
              {sample.week_label || "Sample weekly demo values"} · cadence {analytics?.update_cadence || "weekly"}
            </div>
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            {(analytics?.kpis || []).map((kpi: string) => (
              <div key={kpi} style={cardStyle}>
                <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {titleCase(kpi)}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
                  {sample[kpi] != null
                    ? typeof sample[kpi] === "number" && kpi.includes("revenue")
                      ? money(sample[kpi])
                      : String(sample[kpi])
                    : "—"}
                </div>
              </div>
            ))}
          </div>
          {!analytics && <p style={{ opacity: 0.6 }}>Loading analytics…</p>}
        </section>
      )}

      {status && (
        <pre
          style={{
            marginTop: 20,
            padding: 12,
            background: "#111",
            borderRadius: 8,
            border: "1px solid #333",
            whiteSpace: "pre-wrap",
            fontSize: 12,
            overflowX: "auto",
          }}
        >
          {status}
        </pre>
      )}
    </main>
  );
}
