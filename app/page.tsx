"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Upload,
  Wallet,
  X,
  RefreshCw,
  Download,
  ExternalLink,
} from "lucide-react";
import snapshot from "@/lib/data/snapshot.json";
import {
  defaults,
  normalize,
  digest,
  signal,
  safeLink,
  ticker,
  retrieve,
  type Stock,
  type Rules,
  type Filing,
} from "@/lib/engine";
import { demo, guidance, metrics } from "@/lib/demo";
import researchSnapshot from "@/lib/data/research-snapshot.json";
const stamp = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const pct = (v: number | null | undefined) =>
  v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const category = (s: string) => s.replaceAll("_", " ");
const categories = [
  "results",
  "M&A",
  "management_change",
  "litigation",
  "credit_rating",
  "pledging",
  "fund_raise",
  "capex",
  "earnings_call",
];
const nav = [
  ["brief", "Daily brief", LayoutDashboard],
  ["portfolio", "My portfolio", Wallet],
  ["research", "Research desk", Sparkles],
  ["saved", "Saved evidence", Bookmark],
] as const;
function Spark({ stock }: { stock: Stock }) {
  const values = stock.bars.slice(-20).map((b) => b.close),
    min = Math.min(...values),
    max = Math.max(...values);
  return (
    <svg
      width="96"
      height="30"
      viewBox="0 0 96 30"
      role="img"
      aria-label={`${stock.symbol} last 20 closes`}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        points={values
          .map(
            (v, i) =>
              `${(i * 96) / Math.max(1, values.length - 1)},${27 - ((v - min) / (max - min || 1)) * 24}`,
          )
          .join(" ")}
      />
    </svg>
  );
}
export default function Home() {
  const [view, setView] = useState("brief"),
    [stocks, setStocks] = useState<Stock[]>(snapshot.portfolio as Stock[]),
    [filings, setFilings] = useState<Filing[]>(
      normalize(snapshot.announcements),
    ),
    [anchor, setAnchor] = useState(snapshot.fetchedAt),
    [rules, setRules] = useState<Rules>(defaults),
    [hours, setHours] = useState(24),
    [filter, setFilter] = useState("All"),
    [search, setSearch] = useState(""),
    [saved, setSaved] = useState<string[]>([]),
    [read, setRead] = useState<string[]>([]),
    [settings, setSettings] = useState(false),
    [auto, setAuto] = useState(false),
    [apiKey, setApiKey] = useState(""),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [symbol, setSymbol] = useState("INFY"),
    [query, setQuery] = useState(
      "How strong is cash conversion, and what changed in guidance?",
    ),
    [result, setResult] = useState<any>(null),
    [extra, setExtra] = useState(""),
    [routine, setRoutine] = useState(false),
    [customStart, setCustomStart] = useState(""),
    [customEnd, setCustomEnd] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("finn-v1") || "null");
      if (p) {
        setRules(p.rules || defaults);
        setSaved(p.saved || []);
        setRead(p.read || []);
        setStocks([...(snapshot.portfolio as Stock[]), ...(p.extras || [])]);
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        "finn-v1",
        JSON.stringify({
          rules,
          saved,
          read,
          extras: stocks.filter(
            (s) => !snapshot.portfolio.some((x) => x.symbol === s.symbol),
          ),
        }),
      );
  }, [loaded, rules, saved, read, stocks]);
  async function refresh() {
    setBusy("refresh");
    setNotice("");
    try {
      const res = await fetch("/api/market?type=filings"),
        j: any = await res.json();
      if (!res.ok) throw Error(j.error);
      setFilings(normalize(j.rows));
      setAnchor(j.fetchedAt);
      const updates = await Promise.allSettled(
        stocks.map(async (s) => {
          const r = await fetch(
            "/api/market?symbol=" + encodeURIComponent(s.symbol),
          );
          const x: any = await r.json();
          if (!r.ok) throw Error(x.error);
          return { ...x.stock, sector: s.sector };
        }),
      );
      setStocks((old) =>
        old.map((s, i) =>
          updates[i].status === "fulfilled"
            ? (updates[i] as PromiseFulfilledResult<Stock>).value
            : s,
        ),
      );
      const failed = updates.filter((r) => r.status === "rejected").length;
      setNotice(
        failed
          ? `Filings refreshed. ${failed} price feeds unavailable; their prior dates are retained.`
          : "Sources refreshed. Prices show the latest completed session.",
      );
    } catch (e) {
      setNotice((e as Error).message + " — retained the dated snapshot.");
    } finally {
      setBusy("");
    }
  }
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 300000);
    return () => clearInterval(t);
  }, [auto, stocks]);
  const rows = useMemo(() => {
    const end = customEnd
      ? new Date(customEnd + "+05:30").toISOString()
      : anchor;
    const windowHours = customStart
      ? (Date.parse(end) - Date.parse(customStart + "+05:30")) / 3600000
      : hours;
    return digest(
      filings,
      windowHours,
      end,
      stocks.map((s) => s.symbol),
    );
  }, [filings, anchor, stocks, hours, customStart, customEnd]);
  const signals = stocks
    .map((stock) => ({ stock, s: signal(stock, rules) }))
    .filter((x) => x.s && (x.s.priceAlert || x.s.volumeAlert));
  const selected = (
    view === "saved" ? filings.filter((f) => saved.includes(f.id)) : rows
  ).filter(
    (f) =>
      (filter !== "Unread" || !read.includes(f.id)) &&
      (filter !== "Results" || f.category === "results") &&
      `${f.symbol} ${f.title} ${f.body}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const material = selected.filter((f) => f.score >= 60),
    other = selected.filter((f) => f.score < 60);
  const toggleSave = (id: string) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const openResearch = (s: string) => {
    setSymbol(s);
    setResult(null);
    setView("research");
    setSearch("");
  };
  async function runResearch(live = false) {
    setBusy("research");
    setNotice("");
    try {
      const s = ticker(symbol);
      setSymbol(s);
      if (
        !live &&
        (s === "INFY" || researchSnapshot.some((d) => d.symbol === s))
      ) {
        const docs =
          s === "INFY" ? demo : researchSnapshot.filter((d) => d.symbol === s);
        const evidence = retrieve(query, docs);
        setResult({
          symbol: s,
          query,
          mode:
            s === "INFY"
              ? "Historical source review · FY25"
              : "Reviewed source snapshot · 9 Nov 2026",
          answer: evidence.length
            ? "Source-reviewed notes matched to your question. This is a dated snapshot; use Fetch latest company PDFs for live discovery."
            : "Insufficient evidence in this snapshot. Fetch the latest PDFs or upload a company document.",
          evidence,
          errors: [],
        });
        return;
      }
      const r = await fetch("/api/research", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ symbol: s, query, apiKey }),
        }),
        j: any = await r.json();
      if (!r.ok) throw Error(j.error);
      setResult(j);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function addStock(e: React.FormEvent) {
    e.preventDefault();
    setBusy("add");
    setNotice("");
    try {
      const s = ticker(extra);
      if (stocks.some((x) => x.symbol === s))
        throw Error("This company is already in your portfolio.");
      const r = await fetch("/api/market?symbol=" + encodeURIComponent(s)),
        j: any = await r.json();
      if (!r.ok) throw Error(j.error);
      setStocks((a) => [...a, j.stock]);
      setExtra("");
      setNotice(s + " added to your watchlist.");
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy("research");
    setNotice("");
    try {
      const f = new FormData();
      f.append("file", file);
      f.append("symbol", ticker(symbol));
      f.append("query", query);
      const r = await fetch("/api/upload", { method: "POST", body: f }),
        j: any = await r.json();
      if (!r.ok) throw Error(j.error);
      setResult({ ...j, query, symbol, mode: "Your uploaded PDF" });
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  function download() {
    const b = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              snapshotAt: anchor,
              rules,
              portfolio: stocks,
              saved: filings.filter((f) => saved.includes(f.id)),
              research: result,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(b),
      a = document.createElement("a");
    a.href = url;
    a.download = "finn-evidence.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const card = (f: Filing) => (
    <article className="filing" key={f.id}>
      <div className="filing-top">
        <span className="ticker-avatar">{f.symbol.slice(0, 2)}</span>
        <div>
          <button
            className="text-button company"
            onClick={() => openResearch(f.symbol)}
          >
            {f.symbol} <ArrowUpRight size={13} />
          </button>
          <div className="muted micro">{stamp(f.date)} IST</div>
        </div>
        <span className={"pill " + (f.score >= 80 ? "amber" : "")}>
          {category(f.category)}
        </span>
        <button
          className={"icon-button " + (saved.includes(f.id) ? "active" : "")}
          aria-label={
            saved.includes(f.id) ? "Unsave " + f.symbol : "Save " + f.symbol
          }
          onClick={() => toggleSave(f.id)}
        >
          <Bookmark
            size={17}
            fill={saved.includes(f.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <h3>{f.title}</h3>
      <p className="filing-body">
        {f.body ||
          "The exchange has published a company disclosure. Open the filing for full details."}
      </p>
      <div className="why">
        <span className="dot" /> {f.reason}
      </div>
      <div className="filing-foot">
        <a
          href={safeLink(f.url)}
          target="_blank"
          rel="noreferrer"
          onClick={() => setRead((a) => (a.includes(f.id) ? a : [...a, f.id]))}
        >
          Read exchange filing <ArrowUpRight size={14} />
        </a>
        <span className="micro muted">
          {read.includes(f.id) ? "Read · " : ""}
          {rules.categories.includes(f.category)
            ? "Your alert rule"
            : "Rule-based priority"}{" "}
          · {f.score}/100
        </span>
      </div>
    </article>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="logo" href="#" onClick={() => setView("brief")}>
          finn<span>·</span>
        </a>
        <div className="workspace-label">YOUR INVESTING WORKSPACE</div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={view === id ? "nav-item selected" : "nav-item"}
              onClick={() => {
                setView(id);
                setSearch("");
                setFilter("All");
              }}
            >
              <Icon size={18} />
              {label}
              {id === "saved" && saved.length > 0 && (
                <span className="count">{saved.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="source-note">
            <span className="live-dot" /> Primary sources first
            <p>
              Company filings.
              <br />
              Clear evidence. Your judgment.
            </p>
          </div>
          <button className="nav-item" onClick={() => setSettings(true)}>
            <Settings2 size={18} />
            Preferences
          </button>
          <div className="profile">
            <span className="avatar">AA</span>
            <div>
              Ayushi’s workspace
              <div className="micro muted">ENAM build challenge</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <span className="breadcrumb">
            Workspace <span>/</span> {nav.find((n) => n[0] === view)?.[1]}
          </span>
          <span className="snapshot-label">
            <span className="live-dot" /> Snapshot · {stamp(anchor)} IST
          </span>
          <button
            className="icon-button mobile-settings"
            aria-label="Preferences"
            onClick={() => setSettings(true)}
          >
            <Settings2 size={19} />
          </button>
        </header>
        <main>
          <div className="heading">
            <div>
              <div className="eyebrow">
                {view === "research"
                  ? "PULL · ASK BETTER QUESTIONS"
                  : "PUSH · YOUR PORTFOLIO, IN FOCUS"}
              </div>
              <h1>
                {view === "brief"
                  ? "Your attention, invested well."
                  : view === "portfolio"
                    ? "A view of what you own."
                    : view === "saved"
                      ? "Evidence worth keeping."
                      : "Go beyond the headline."}
              </h1>
              <p className="muted">
                {view === "research"
                  ? "Trace every answer back to a company document."
                  : view === "portfolio"
                    ? "Completed-session prices, transparent signals, and source links."
                    : "The disclosures and market moves that deserve a closer look."}
              </p>
            </div>
            <button className="secondary" onClick={refresh} disabled={!!busy}>
              <RefreshCw
                size={15}
                className={busy === "refresh" ? "spin" : ""}
              />
              {busy === "refresh" ? "Refreshing…" : "Refresh sources"}
            </button>
          </div>
          {notice && (
            <div role="status" className="notice">
              {notice}
              <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
                <X size={15} />
              </button>
            </div>
          )}
          {view !== "research" && (
            <div className="stats">
              <div className="stat">
                <span>Companies tracked</span>
                <strong>
                  {stocks.length}
                  <span className="stat-suffix">NSE</span>
                </strong>
                <small>Large, mid & small cap coverage</small>
              </div>
              <div className="stat">
                <span>Filings in your window</span>
                <strong>
                  {rows.length}
                  <span className="stat-suffix">
                    {customStart ? "custom" : hours + "h"}
                  </span>
                </strong>
                <small>
                  {rows.filter((f) => f.score >= 60).length} flagged for closer
                  review
                </small>
              </div>
              <div className="stat">
                <span>Market signals</span>
                <strong>
                  {signals.length}
                  <TrendingUp size={24} />
                </strong>
                <small>
                  Price ≥ {rules.price}% · volume ≥ {rules.volume}×
                </small>
              </div>
              <div className="stat editorial">
                <span>LESS NOISE. MORE CONTEXT.</span>
                <strong>
                  Read what changed.
                  <br />
                  Skip the paperwork.
                </strong>
                <small>
                  Evidence, before opinion. <ArrowUpRight size={18} />
                </small>
              </div>
            </div>
          )}
          {(view === "brief" || view === "saved") && (
            <div className="dashboard-grid">
              <section className="panel inbox">
                <div className="panel-title">
                  <div>
                    <h2>
                      {view === "saved"
                        ? "Saved evidence"
                        : "Your signal inbox"}
                    </h2>
                    <p className="muted micro">
                      Prioritized by disclosure type. Materiality is a review
                      aid.
                    </p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="Configure alerts"
                    onClick={() => setSettings(true)}
                  >
                    <SlidersHorizontal size={18} />
                  </button>
                </div>
                <div className="toolbar">
                  <div className="tabs">
                    {["All", "Unread", "Results"].map((t) => (
                      <button
                        className={filter === t ? "chosen" : ""}
                        key={t}
                        onClick={() => setFilter(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <select
                    aria-label="Digest window"
                    value={hours}
                    onChange={(e) => {
                      setHours(+e.target.value);
                      setCustomStart("");
                      setCustomEnd("");
                    }}
                  >
                    {[24, 72, 168, 720].map((h) => (
                      <option key={h} value={h}>
                        {h < 168 ? h + " hours" : h / 24 + " days"}
                      </option>
                    ))}
                  </select>
                </div>
                <details className="date-options">
                  <summary>
                    Custom date window <ChevronDown size={12} />
                  </summary>
                  <div className="date-fields">
                    <label>
                      From (IST)
                      <input
                        type="datetime-local"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                      />
                    </label>
                    <label>
                      To (IST)
                      <input
                        type="datetime-local"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                      />
                    </label>
                  </div>
                </details>
                <label className="search-box">
                  <Search size={16} />
                  <input
                    placeholder="Find a company or disclosure…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                {material.map(card)}
                {!material.length && (
                  <div className="empty">
                    <Check size={26} />
                    <h3>No high-priority filings here.</h3>
                    <p>
                      Try a longer window or inspect routine disclosures below.
                    </p>
                  </div>
                )}
                {other.length > 0 && (
                  <>
                    <button
                      className="routine-toggle"
                      onClick={() => setRoutine(!routine)}
                    >
                      <FileText size={16} />
                      {other.length} routine or lower-priority disclosures
                      <ChevronDown size={16} />
                    </button>
                    {routine && other.map(card)}
                  </>
                )}
                <div className="panel-footer">
                  NSE corporate announcements · Window ends{" "}
                  {stamp(customEnd ? customEnd + "+05:30" : anchor)} IST
                </div>
              </section>
              <aside className="right-rail">
                <section className="panel radar">
                  <div className="panel-title">
                    <h2>Market radar</h2>
                    <TrendingUp size={18} />
                  </div>
                  <p className="muted micro">
                    Latest completed session vs previous close
                  </p>
                  {signals.slice(0, 5).map(({ stock, s }) => (
                    <button
                      className="radar-row"
                      key={stock.symbol}
                      onClick={() => openResearch(stock.symbol)}
                    >
                      <span>
                        <b>{stock.symbol}</b>
                        <small>
                          {s?.volumeAlert
                            ? `${s.multiple?.toFixed(1)}× volume`
                            : "Price threshold crossed"}
                        </small>
                      </span>
                      <span
                        className={(s?.move || 0) < 0 ? "negative" : "positive"}
                      >
                        {pct(s?.move)}
                      </span>
                    </button>
                  ))}
                  {!signals.length && (
                    <p className="empty-small">
                      No thresholds crossed in this snapshot.
                    </p>
                  )}
                  <button
                    className="text-button rail-link"
                    onClick={() => setView("portfolio")}
                  >
                    View portfolio <ArrowRight size={15} />
                  </button>
                </section>
                <section className="case-card">
                  <span className="eyebrow">THE PROMISE LEDGER</span>
                  <h2>Did management keep its promise?</h2>
                  <p>
                    Follow Infosys’ FY25 guidance from first promise to final
                    result.
                  </p>
                  <div className="mini-chart">
                    {guidance.map((g, i) => (
                      <div key={g.label}>
                        <span style={{ height: g.mid * 16 }} />
                        <small>Q{i}</small>
                      </div>
                    ))}
                    <div className="actual-bar">
                      <span style={{ height: 4.2 * 16 }} />
                      <small>Actual</small>
                    </div>
                  </div>
                  <button onClick={() => openResearch("INFY")}>
                    Explore the case <ArrowUpRight size={17} />
                  </button>
                  <small>Historical illustration · primary sources</small>
                </section>
                <div className="rail-note">
                  <FileText size={17} />
                  <p>
                    Every filing links to the original. Scores are deterministic
                    rules, not investment recommendations.
                  </p>
                </div>
              </aside>
            </div>
          )}
          {view === "portfolio" && (
            <section className="panel portfolio-panel">
              <div className="panel-title">
                <div>
                  <h2>Your portfolio</h2>
                  <p className="muted micro">
                    20-session volume baseline excludes the current session.
                  </p>
                </div>
                <button className="text-button" onClick={download}>
                  <Download size={15} />
                  Export
                </button>
              </div>
              <form className="add-form" onSubmit={addStock}>
                <input
                  aria-label="Add NSE ticker"
                  placeholder="Add an NSE ticker, e.g. COFORGE"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                />
                <button className="primary" disabled={!!busy}>
                  {busy === "add" ? "Adding…" : "+ Add company"}
                </button>
              </form>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Close / session</th>
                      <th>1D change</th>
                      <th>20 sessions</th>
                      <th>Volume</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => {
                      const s = signal(stock, rules);
                      return (
                        <tr key={stock.symbol}>
                          <td>
                            <button
                              className="text-button"
                              onClick={() => openResearch(stock.symbol)}
                            >
                              <b>{stock.symbol}</b>
                              <ArrowUpRight size={12} />
                            </button>
                            <small>{stock.name}</small>
                          </td>
                          <td>
                            ₹
                            {s?.close.toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            }) || "—"}
                            <small>{s?.date || "Unavailable"}</small>
                          </td>
                          <td
                            className={
                              (s?.move || 0) < 0 ? "negative" : "positive"
                            }
                          >
                            {pct(s?.move)}
                          </td>
                          <td
                            className={
                              (s?.move || 0) < 0 ? "negative" : "positive"
                            }
                          >
                            <Spark stock={stock} />
                          </td>
                          <td>{s?.multiple?.toFixed(2) || "—"}×</td>
                          <td>
                            <a
                              aria-label={`${stock.symbol} Yahoo source`}
                              href={safeLink(stock.source)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink size={16} />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="panel-footer">
                EOD prices: Yahoo Finance. Market prices are separate from
                primary-source company research.
              </div>
            </section>
          )}
          {view === "research" && (
            <>
              <section className="panel research-input">
                <div className="panel-title">
                  <h2>Ask the source, not the noise.</h2>
                  <span className="pill">PRIMARY DOCUMENTS</span>
                </div>
                <div className="company-chips">
                  {["INFY", "TCS", "WIPRO", "ITC", "PERSISTENT"].map((s) => (
                    <button
                      key={s}
                      className={symbol === s ? "chosen" : ""}
                      onClick={() => {
                        setSymbol(s);
                        setResult(null);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="question-row">
                  <input
                    className="symbol-input"
                    aria-label="Research NSE ticker"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  />
                  <input
                    aria-label="Research question"
                    placeholder="Ask about cash, growth, guidance or risks…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void runResearch();
                    }}
                  />
                  <button
                    className="primary"
                    aria-label="Run research"
                    disabled={!!busy}
                    onClick={() => runResearch()}
                  >
                    {busy === "research" ? (
                      <RefreshCw className="spin" size={19} />
                    ) : (
                      <ArrowRight size={19} />
                    )}
                  </button>
                </div>
                <div className="question-chips">
                  {[
                    "What drives the business?",
                    "How strong is cash conversion?",
                    "What changed in guidance?",
                    "What are the main risks?",
                  ].map((q) => (
                    <button key={q} onClick={() => setQuery(q)}>
                      {q}
                    </button>
                  ))}
                </div>
                <div className="research-actions">
                  <button
                    className="text-button"
                    disabled={!!busy}
                    onClick={() => runResearch(true)}
                  >
                    <RefreshCw size={14} />
                    Fetch latest company PDFs
                  </button>
                  <label className="text-button upload">
                    <Upload size={14} />
                    Upload company PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => upload(e.target.files?.[0])}
                      disabled={!!busy}
                    />
                  </label>
                  <span className="micro muted">
                    PDF ≤ 12 MB · no scanned documents
                  </span>
                </div>
                <p className="micro muted">
                  Five example companies have dated, source-reviewed notes.
                  Other NSE tickers use live discovery. Source access may fail;
                  upload a company PDF to continue.
                </p>
              </section>
              {result && (
                <section className="panel result">
                  <div className="panel-title">
                    <div>
                      <span className="eyebrow">
                        {result.symbol} · {result.mode}
                      </span>
                      <h2>{result.query}</h2>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Export research"
                      onClick={download}
                    >
                      <Download size={17} />
                    </button>
                  </div>
                  <p>{result.answer}</p>
                  {result.claims?.map((c: any, i: number) => (
                    <div className="claim" key={i}>
                      <b>{c.kind || "Source-based synthesis"}</b>
                      <p>{c.text}</p>
                      <span className="micro muted">
                        Evidence: {(c.sources || []).join(", ")}
                      </span>
                    </div>
                  ))}
                  {result.evidence?.map((e: any) => (
                    <article className="evidence" key={e.id}>
                      <span className="pill">
                        {e.kind} · {e.period}
                      </span>
                      <h3>{e.title}</h3>
                      <p>{e.text}</p>
                      <a
                        href={
                          e.url?.startsWith("https:")
                            ? safeLink(e.url) +
                              (e.period?.includes("document-level")
                                ? ""
                                : `#page=${e.page}`)
                            : undefined
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        {e.url?.startsWith("https:")
                          ? "Open primary source"
                          : "Uploaded source"}{" "}
                        ·{" "}
                        {e.period?.includes("document-level")
                          ? "document reference"
                          : "page " + e.page}{" "}
                        <ArrowUpRight size={14} />
                      </a>
                      <small className="muted">Evidence ID: {e.id}</small>
                    </article>
                  ))}
                  {result.errors?.length > 0 && (
                    <div className="notice">
                      Some sources were unavailable: {result.errors.join(" · ")}
                    </div>
                  )}
                  {result.pagesIndexed && (
                    <p className="muted micro">
                      {result.pagesIndexed} pages indexed ·{" "}
                      {result.fetchedAt ? stamp(result.fetchedAt) + " IST" : ""}
                    </p>
                  )}
                </section>
              )}
              {symbol === "INFY" && (
                <section className="panel ledger">
                  <div className="panel-title">
                    <div>
                      <span className="eyebrow">
                        HISTORICAL CASE STUDY · INFOSYS FY25
                      </span>
                      <h2>The promise ledger</h2>
                      <p className="muted">
                        A changing outlook. A measurable outcome.
                      </p>
                    </div>
                    <span className="pill amber">Actual: 4.2% CC growth</span>
                  </div>
                  <div className="ledger-grid">
                    <div className="guidance-bars">
                      {guidance.map((g) => (
                        <a
                          href={g.url}
                          target="_blank"
                          rel="noreferrer"
                          key={g.label}
                        >
                          <span>{g.label}</span>
                          <div>
                            <i style={{ width: (g.mid / 5) * 100 + "%" }} />
                          </div>
                          <b>{g.range}</b>
                          <ArrowUpRight size={13} />
                        </a>
                      ))}
                      <div className="ledger-insight">
                        <b>30 bps below the final guidance floor.</b>
                        <p>
                          Fact: actual FY25 constant-currency growth was 4.2%,
                          versus the final 4.5–5% range. Inference: the
                          final-quarter outcome fell short of that outlook; this
                          alone does not establish the cause.
                        </p>
                        <a href={demo[0].url} target="_blank" rel="noreferrer">
                          Verify the outcome <ArrowUpRight size={13} />
                        </a>
                      </div>
                    </div>
                    <div className="metric-grid">
                      {metrics.map(([label, value, note]) => (
                        <div key={label}>
                          <span>{label}</span>
                          <strong>{value}</strong>
                          <small>{note}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                  <details className="results-detail">
                    <summary>
                      Inspect Q4 FY25 consolidated results{" "}
                      <ChevronDown size={16} />
                    </summary>
                    <table>
                      <thead>
                        <tr>
                          <th>₹ crore</th>
                          <th>Q4 FY25</th>
                          <th>Q4 FY24</th>
                          <th>YoY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Revenue", 40925, 37923],
                          ["PBT", 9663, 10240],
                          ["PAT (owners)", 7033, 7969],
                        ].map(([name, a, b]) => (
                          <tr key={name}>
                            <td>{name}</td>
                            <td>{a}</td>
                            <td>{b}</td>
                            <td>{pct((Number(a) / Number(b) - 1) * 100)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="micro muted">
                      EBITDA and QoQ comparison: not extracted in this scoped
                      case. Tax-related income affects profit comparability.{" "}
                      <a href={demo[1].url} target="_blank" rel="noreferrer">
                        Read IFRS results ↗
                      </a>
                    </p>
                  </details>
                </section>
              )}
            </>
          )}
          <footer className="footer">
            <span>finn · Evidence, before opinion.</span>
            <span>
              Prototype · Primary-source research · Not investment advice
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav">
        {nav.map(([id, label, Icon]) => (
          <button
            key={id}
            className={view === id ? "chosen" : ""}
            onClick={() => {
              setView(id);
              setSearch("");
              setFilter("All");
            }}
          >
            <Icon size={19} />
            <span>
              {id === "portfolio" ? "Portfolio" : label.split(" ")[0]}
            </span>
          </button>
        ))}
      </nav>
      {settings && (
        <div className="modal-backdrop" onClick={() => setSettings(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Alert preferences"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-title">
              <h2>Make it your brief.</h2>
              <button
                className="icon-button"
                aria-label="Close preferences"
                onClick={() => setSettings(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="muted">
              Configure transparent, deterministic alert rules.
            </p>
            <label className="slider-label">
              Absolute daily price move <b>{rules.price}%</b>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={rules.price}
                onChange={(e) => setRules({ ...rules, price: +e.target.value })}
              />
            </label>
            <label className="slider-label">
              Volume / prior 20-session average <b>{rules.volume}×</b>
              <input
                type="range"
                min="1.2"
                max="5"
                step="0.1"
                value={rules.volume}
                onChange={(e) =>
                  setRules({ ...rules, volume: +e.target.value })
                }
              />
            </label>
            <h3>Disclosure alerts</h3>
            <div className="category-options">
              {categories.map((c) => (
                <label key={c}>
                  <input
                    type="checkbox"
                    checked={rules.categories.includes(c)}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        categories: e.target.checked
                          ? [...rules.categories, c]
                          : rules.categories.filter((x) => x !== c),
                      })
                    }
                  />
                  {category(c)}
                </label>
              ))}
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              />
              Refresh every 5 minutes while this tab is visible
            </label>
            <p className="micro muted">
              No background delivery or email alerts in this prototype.
            </p>
            <label className="key-label">
              Optional Groq API key
              <input
                type="password"
                autoComplete="off"
                placeholder="Session only — never saved"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </label>
            <p className="micro muted">
              Enables source-grounded synthesis for fetched company PDFs.
              Relevant passages are sent to Groq. Uploaded files use local
              extraction on the server and are not sent to Groq.
            </p>
            <button className="primary full" onClick={() => setSettings(false)}>
              Done <Check size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
