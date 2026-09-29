"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { request } from "../lib/api";
import {
  Job,
  Person,
  Task,
  Workspace,
  emptyWorkspace,
  isCrewModule,
  isJobModule,
  loadWorkspace,
  saveWorkspace,
  uid,
} from "../lib/workspace";

type Tab = "home" | "pricing" | "modules" | "command" | "flow" | "pulse";

type OfferTier = { key: string; setup_fee: number; monthly_fee: number; includes: string[] };
type ModuleItem = { name: string; price: number; vertical: string; installed: boolean; blurb: string };

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "pricing", label: "Pricing" },
  { id: "modules", label: "Modules" },
  { id: "command", label: "Command" },
  { id: "flow", label: "Flow" },
  { id: "pulse", label: "Pulse" },
];

const inputStyle: Record<string, string | number> = {
  padding: 12, borderRadius: 8, border: "1px solid #333", background: "#111", color: "#fff", width: "100%", boxSizing: "border-box",
};
const cardStyle: Record<string, string | number> = {
  padding: 16, borderRadius: 12, border: "1px solid #1f2937", background: "#111827",
};
function money(n: number) { return `$${Number(n).toLocaleString()}`; }
function titleCase(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [brand, setBrand] = useState("FanzSpot Labs");
  const [offers, setOffers] = useState<OfferTier[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [flow, setFlow] = useState<any>(null);
  const [ws, setWs] = useState<Workspace>(emptyWorkspace());
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [jobNotes, setJobNotes] = useState("");
  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [taskText, setTaskText] = useState("");

  const persist = (next: Workspace) => setWs(saveWorkspace(next));
  const syncModules = (list: ModuleItem[], installed: string[]) => {
    const set = new Set(installed);
    return list.map((m) => ({ ...m, installed: set.has(m.name) }));
  };

  const loadProduct = useCallback(async () => {
    const local = loadWorkspace();
    setWs(local);
    if (local.owner) setEmail(local.owner);
    try {
      const saved = JSON.parse(localStorage.getItem("the-one-saas.session") || "{}");
      if (saved.token) setToken(String(saved.token));
      if (saved.email) setEmail(String(saved.email));
    } catch {}
    try {
      const [w, o, m, f] = await Promise.all([
        request("/whitelabel"), request("/offers"), request("/modules"), request("/flow"),
      ]);
      if (w?.brand_alias) setBrand(w.brand_alias);
      setOffers(o?.tiers || []);
      setModules(syncModules(m?.modules || [], local.installed));
      setFlow(f);
    } catch (e: any) {
      setStatus(e.message || String(e));
    }
  }, []);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  async function run(_label: string, fn: () => Promise<void>) {
    setBusy(true); setStatus("");
    try { await fn(); } catch (e: any) { setStatus(e.message || String(e)); } finally { setBusy(false); }
  }

  async function ensureSession() {
    if (token) return token;
    const res = await request("/session", { method: "POST" });
    setToken(res.token); setEmail(res.email);
    localStorage.setItem("the-one-saas.session", JSON.stringify({ token: res.token, email: res.email }));
    persist({ ...ws, owner: res.email });
    return res.token as string;
  }

  function installModule(name: string) {
    const installed = ws.installed.includes(name) ? ws.installed : [...ws.installed, name];
    const next = saveWorkspace({ ...ws, installed });
    setWs(next);
    setModules((prev) => syncModules(prev, installed));
    setActiveModule(name);
    setTab("modules");
    setStatus(name + " is open. Add a real record.");
  }

  function removeModule(name: string) {
    const installed = ws.installed.filter((n) => n !== name);
    const next = saveWorkspace({ ...ws, installed });
    setWs(next);
    setModules((prev) => syncModules(prev, installed));
    if (activeModule === name) setActiveModule(null);
    setStatus(name + " removed from this device.");
  }

  function addJob(moduleName: string) {
    if (!jobTitle.trim()) { setStatus("Job needs a name."); return; }
    const job: Job = { id: uid(), module: moduleName, title: jobTitle.trim(), address: jobAddress.trim(), notes: jobNotes.trim(), status: "open", createdAt: new Date().toISOString() };
    persist({ ...ws, jobs: [job, ...ws.jobs] });
    setJobTitle(""); setJobAddress(""); setJobNotes("");
    setStatus("Job saved on this phone.");
  }

  function setJobStatus(id: string, statusValue: Job["status"]) {
    persist({ ...ws, jobs: ws.jobs.map((j) => (j.id === id ? { ...j, status: statusValue } : j)) });
  }

  function addPerson(moduleName: string) {
    if (!personName.trim()) { setStatus("Name required."); return; }
    const person: Person = { id: uid(), module: moduleName, name: personName.trim(), role: personRole.trim() || "crew" };
    persist({ ...ws, crew: [person, ...ws.crew] });
    setPersonName(""); setPersonRole("");
    setStatus("Person saved.");
  }

  function addTask(moduleName: string) {
    if (!taskText.trim()) { setStatus("Task text required."); return; }
    const task: Task = { id: uid(), module: moduleName, text: taskText.trim(), done: false };
    persist({ ...ws, tasks: [task, ...ws.tasks] });
    setTaskText("");
    setStatus("Task saved.");
  }

  const smoke = flow?.smokescreen;
  const active = modules.find((m) => m.name === activeModule) || null;
  const openJobs = ws.jobs.filter((j) => j.status !== "done").length;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 48px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <p style={{ letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5, fontSize: 11, margin: 0 }}>{brand}</p>
          <h1 style={{ margin: "6px 0 0", fontSize: 28 }}>The One SaaS</h1>
        </div>
        {ws.installed.length > 0 && (
          <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid #166534", background: "#052e16", color: "#4ade80" }}>
            {ws.installed.length} live
          </span>
        )}
      </header>

      <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16, marginBottom: 8 }}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ padding: "8px 12px", borderRadius: 999, border: on ? "1px solid #38bdf8" : "1px solid #334155", background: on ? "#0c4a6e" : "#0f172a", color: on ? "#e0f2fe" : "#cbd5e1", fontSize: 13, fontWeight: on ? 700 : 500 }}>
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "home" && (
        <section style={{ marginTop: 16, display: "grid", gap: 14 }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>{smoke?.headline || "Working modules on this phone"}</h2>
            <p style={{ opacity: 0.8, lineHeight: 1.5, marginBottom: 0 }}>Install a module and it opens a pad. Jobs, crew, and tasks stay on this device.</p>
          </div>
          <button disabled={busy} onClick={() => run("start", async () => { await ensureSession(); setTab("modules"); setStatus("Session live. Install a module and add a record."); })} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #fbbf24", background: "linear-gradient(180deg,#f59e0b,#d97706)", color: "#111", fontWeight: 800 }}>
            Start workspace
          </button>
        </section>
      )}

      {tab === "pricing" && (
        <section style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {offers.map((tier) => (
            <div key={tier.key} style={cardStyle}>
              <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.55 }}>{tier.key}</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{money(tier.monthly_fee)}<span style={{ fontSize: 13, fontWeight: 500, opacity: 0.6 }}>/mo</span></div>
              <div style={{ fontSize: 13, opacity: 0.65 }}>Setup {money(tier.setup_fee)}</div>
            </div>
          ))}
        </section>
      )}

      {tab === "modules" && (
        <section style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <p style={{ opacity: 0.7, margin: 0 }}>Install opens the pad. Save a job, person, or task. That is the product.</p>
          {active && (
            <div style={{ ...cardStyle, border: "1px solid #166534" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{active.name}</strong>
                <button type="button" onClick={() => setActiveModule(null)} style={{ background: "none", border: 0, color: "#94a3b8" }}>Close</button>
              </div>
              {isJobModule(active.vertical) && (
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <input placeholder="Job name" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} style={inputStyle} />
                  <input placeholder="Address / site" value={jobAddress} onChange={(e) => setJobAddress(e.target.value)} style={inputStyle} />
                  <input placeholder="Notes — no price without squares" value={jobNotes} onChange={(e) => setJobNotes(e.target.value)} style={inputStyle} />
                  <button type="button" onClick={() => addJob(active.name)} style={{ padding: "10px 14px", borderRadius: 8, border: 0, background: "#fff", color: "#000", fontWeight: 700 }}>Save job</button>
                  {ws.jobs.filter((j) => j.module === active.name).map((j) => (
                    <div key={j.id} style={{ padding: 10, borderRadius: 8, border: "1px solid #334155" }}>
                      <div style={{ fontWeight: 700 }}>{j.title}</div>
                      <div style={{ fontSize: 13, opacity: 0.7 }}>{j.address || "No address"}</div>
                      {j.notes ? <div style={{ fontSize: 13, marginTop: 4 }}>{j.notes}</div> : null}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        {(["open", "in_progress", "done"] as const).map((s) => (
                          <button key={s} type="button" onClick={() => setJobStatus(j.id, s)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, border: j.status === s ? "1px solid #4ade80" : "1px solid #334155", background: j.status === s ? "#052e16" : "#0f172a", color: "#e2e8f0" }}>{s.replace("_", " ")}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isCrewModule(active.vertical) && (
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <input placeholder="Name" value={personName} onChange={(e) => setPersonName(e.target.value)} style={inputStyle} />
                  <input placeholder="Role" value={personRole} onChange={(e) => setPersonRole(e.target.value)} style={inputStyle} />
                  <button type="button" onClick={() => addPerson(active.name)} style={{ padding: "10px 14px", borderRadius: 8, border: 0, background: "#fff", color: "#000", fontWeight: 700 }}>Save person</button>
                  {ws.crew.filter((p) => p.module === active.name).map((p) => (
                    <div key={p.id} style={{ padding: 10, borderRadius: 8, border: "1px solid #334155" }}><strong>{p.name}</strong><div style={{ fontSize: 13, opacity: 0.7 }}>{p.role}</div></div>
                  ))}
                </div>
              )}
              {!isJobModule(active.vertical) && !isCrewModule(active.vertical) && (
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  <input placeholder="Task / note" value={taskText} onChange={(e) => setTaskText(e.target.value)} style={inputStyle} />
                  <button type="button" onClick={() => addTask(active.name)} style={{ padding: "10px 14px", borderRadius: 8, border: 0, background: "#fff", color: "#000", fontWeight: 700 }}>Save task</button>
                  {ws.tasks.filter((t) => t.module === active.name).map((t) => (
                    <button key={t.id} type="button" onClick={() => persist({ ...ws, tasks: ws.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) })} style={{ textAlign: "left", padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: t.done ? "#64748b" : "#e2e8f0", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          {modules.map((m) => (
            <div key={m.name} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <strong>{m.name}</strong>
                <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.75 }}>{m.blurb}</p>
              </div>
              {m.installed ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setActiveModule(m.name); setStatus(m.name + " open."); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #166534", background: "#052e16", color: "#4ade80", fontWeight: 700 }}>Open</button>
                  <button onClick={() => removeModule(m.name)} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #444", background: "#1a1a1a", color: "#fff" }}>Remove</button>
                </div>
              ) : (
                <button disabled={busy} onClick={() => run("install", async () => { await ensureSession(); installModule(m.name); })} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #444", background: "#1a1a1a", color: "#fff", fontWeight: 700 }}>Install</button>
              )}
            </div>
          ))}
        </section>
      )}

      {tab === "command" && (
        <section style={{ marginTop: 16 }}>
          <p style={{ opacity: 0.7 }}>Start a session, then run a brief against the jobs on this phone.</p>
          <button disabled={busy} onClick={() => run("session", async () => { await ensureSession(); setStatus("Workspace session live."); })} style={{ marginTop: 8, width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #fbbf24", background: "linear-gradient(180deg,#f59e0b,#d97706)", color: "#111", fontWeight: 800 }}>Start workspace session</button>
          <button disabled={busy || !token} onClick={() => run("execute", async () => { const res = await request("/execute?token=" + encodeURIComponent(token), { method: "POST", body: JSON.stringify({ installed: ws.installed, openJobs, crew: ws.crew.length }) }); setStatus([res.message, ...(res.next || [])].join("\n")); })} style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, border: "1px solid #444", background: token ? "#166534" : "#222", color: "#fff" }}>Run brief</button>
          {email ? <p style={{ marginTop: 16, fontSize: 12, opacity: 0.5 }}>session {email}</p> : null}
        </section>
      )}

      {tab === "flow" && (
        <section style={{ marginTop: 16 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Index of Flow</h3>
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
              {(flow?.value_loop || []).map((step: string, i: number) => (<li key={i}>{step}</li>))}
            </ol>
          </div>
        </section>
      )}

      {tab === "pulse" && (
        <section style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, opacity: 0.55 }}>THIS DEVICE</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>Workspace pulse</div>
            <div style={{ marginTop: 8, fontSize: 32, fontWeight: 800, color: "#38bdf8" }}>{openJobs}</div>
            <div style={{ fontSize: 12, opacity: 0.55 }}>Open jobs on this phone</div>
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            <div style={cardStyle}><div style={{ fontSize: 11, opacity: 0.55 }}>MODULES LIVE</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{ws.installed.length}</div></div>
            <div style={cardStyle}><div style={{ fontSize: 11, opacity: 0.55 }}>CREW</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{ws.crew.length}</div></div>
            <div style={cardStyle}><div style={{ fontSize: 11, opacity: 0.55 }}>TASKS OPEN</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{ws.tasks.filter((t) => !t.done).length}</div></div>
            <div style={cardStyle}><div style={{ fontSize: 11, opacity: 0.55 }}>JOBS TOTAL</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{ws.jobs.length}</div></div>
          </div>
        </section>
      )}

      {status && (tab === "command" || tab === "modules" || tab === "home") && (
        <div style={{ marginTop: 20, padding: 12, background: "#111", borderRadius: 8, border: "1px solid #333", fontSize: 13, whiteSpace: "pre-wrap" }}>{status}</div>
      )}
    </main>
  );
}
