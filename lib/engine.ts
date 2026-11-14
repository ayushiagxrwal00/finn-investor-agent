export type Bar = { date: string; close: number; volume: number };
export type Stock = {
  symbol: string;
  name: string;
  sector: string;
  bars: Bar[];
  source: string;
  status: string;
};
export type Filing = {
  id: string;
  symbol: string;
  title: string;
  body: string;
  date: string;
  url: string;
  category: string;
  score: number;
  reason: string;
};
export type Rules = { price: number; volume: number; categories: string[] };
export type Evidence = {
  id: string;
  symbol: string;
  title: string;
  url: string;
  page: number;
  text: string;
  kind: string;
  period: string;
};
export const defaults: Rules = {
  price: 3,
  volume: 2,
  categories: [
    "results",
    "M&A",
    "management_change",
    "litigation",
    "credit_rating",
    "pledging",
  ],
};
export function ticker(s: string) {
  s = s.trim().toUpperCase().replace(/\.NS$/, "");
  if (!/^[A-Z0-9][A-Z0-9&-]{0,24}$/.test(s))
    throw Error("Enter an NSE ticker such as INFY or M&M.");
  return s;
}
export function change(a: number, b: number) {
  return b > 0 ? (a / b - 1) * 100 : null;
}
export function signal(s: Stock, r: Rules) {
  const last = s.bars.at(-1),
    prev = s.bars.at(-2);
  if (!last || !prev) return null;
  const hist = s.bars.slice(-21, -1),
    avg = hist.length === 20 ? hist.reduce((a, b) => a + b.volume, 0) / 20 : 0;
  const move = change(last.close, prev.close),
    multiple = avg > 0 ? last.volume / avg : null;
  return {
    ...last,
    move,
    multiple,
    priceAlert: move != null && Math.abs(move) + 1e-9 >= r.price,
    volumeAlert: multiple != null && multiple >= r.volume,
  };
}
const rules: [string, RegExp, number, string][] = [
  [
    "unclassified",
    /newspaper|publication|compliance certificate|trading window|loss of share|duplicate share|esop|redemption.*commercial paper/i,
    15,
    "Routine paperwork; retained for auditability.",
  ],
  [
    "litigation",
    /litigation|penalty|fraud|insolvency|regulatory order/i,
    95,
    "Potential legal, funding or governance impact.",
  ],
  [
    "management_change",
    /resign|chief financial|chief executive|managing director|appointment.*director/i,
    88,
    "Leadership changes can affect execution and governance.",
  ],
  [
    "insider_trading",
    /insider|promoter.*(buy|sell|disposal|acquisition)/i,
    65,
    "Ownership change; inspect size and context.",
  ],
  [
    "M&A",
    /acquisition|merger|demerger|joint venture|sale of.*stake/i,
    85,
    "Changes the business mix or capital allocation.",
  ],
  [
    "results",
    /financial results|audited results|unaudited results|quarterly results/i,
    90,
    "Review earnings, margins and cash conversion.",
  ],
  [
    "pledging",
    /pledge|encumbrance/i,
    85,
    "Changes promoter financing exposure.",
  ],
  [
    "credit_rating",
    /credit rating|rating.*(downgrad|upgrad|reaffirm)/i,
    70,
    "May change funding costs or credit risk.",
  ],
  [
    "fund_raise",
    /fund rais|qip|rights issue|buyback|commercial paper/i,
    75,
    "Changes funding or the share count.",
  ],
  [
    "earnings_call",
    /transcript|earnings call|conference call/i,
    60,
    "Primary evidence for management guidance and assumptions.",
  ],
  [
    "capex",
    /capex|capacity expansion|new plant/i,
    78,
    "Review investment size, funding and expected return.",
  ],
  [
    "dividend",
    /dividend/i,
    50,
    "Capital return; check approval and record date.",
  ],
  [
    "bonus_split",
    /bonus|stock split|sub.division/i,
    55,
    "Share-count change; adjust historical comparisons.",
  ],
  ["postal_ballot", /postal ballot/i, 25, "Shareholder approval process."],
  [
    "agm_egm",
    /annual general|extra.ordinary general|agm|egm/i,
    25,
    "Meeting paperwork; inspect resolutions if needed.",
  ],
  [
    "investor_meetings",
    /investor meet|analyst.*meet|schedule of meet/i,
    20,
    "Routine meeting schedule, not evidence of an outcome.",
  ],
  [
    "press_release",
    /press release|order win|bagging|award|partnership/i,
    45,
    "Read the disclosure before inferring materiality.",
  ],
];
export function classify(title: string, body = "") {
  const r = rules.find(([, re]) => re.test(title + " " + body));
  return r
    ? { category: r[0], score: r[2], reason: r[3] }
    : {
        category: "unclassified",
        score: 20,
        reason: "Unclassified disclosure; manual review may be useful.",
      };
}
export function normalize(rows: any[]): Filing[] {
  const seen = new Set<string>();
  return rows.flatMap((r) => {
    const id = String(
      r.seq_id || r.symbol + ":" + r.attchmntFile + ":" + r.an_dt,
    );
    if (seen.has(id)) return [];
    seen.add(id);
    const d = new Date(
      r.sort_date
        ? String(r.sort_date).replace(" ", "T") + "+05:30"
        : String(r.an_dt) + " GMT+0530",
    );
    if (!Number.isFinite(+d)) return [];
    const title = String(r.desc || "Disclosure"),
      body = String(r.attchmntText || "");
    return [
      {
        id,
        symbol: r.symbol,
        title,
        body,
        date: d.toISOString(),
        url: String(r.attchmntFile || ""),
        ...classify(title, body),
      },
    ];
  });
}
export function digest(
  fs: Filing[],
  hours: number,
  anchor: string,
  symbols: string[],
) {
  const end = Date.parse(anchor);
  return fs
    .filter(
      (f) =>
        symbols.includes(f.symbol) &&
        Date.parse(f.date) > end - hours * 3600000 &&
        Date.parse(f.date) <= end,
    )
    .sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
}
export function safeLink(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.href : "#";
  } catch {
    return "#";
  }
}
const stop = new Set(
  "the and are was were for what how does company about with from this that have has its".split(
    " ",
  ),
);
const terms = (s: string) =>
  s
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((t) => t.length > 2 && !stop.has(t)) || [];
const synonyms: Record<string, string[]> = {
  cash: ["flow", "conversion", "receivables"],
  guidance: ["outlook", "expect", "growth"],
  risk: ["uncertainty", "headwind", "decline"],
  margin: ["profit", "operating"],
  business: ["services", "segment", "revenue"],
  debt: ["borrowings", "lease", "liabilities"],
};
export function retrieve(query: string, docs: Evidence[], k = 6) {
  const q = [
    ...new Set(terms(query).flatMap((t) => [t, ...(synonyms[t] || [])])),
  ];
  const ix = docs.map((d) => ({ d, t: terms(d.text) }));
  const avg = ix.reduce((s, x) => s + x.t.length, 0) / (ix.length || 1);
  return ix
    .map(({ d, t }) => {
      let score = 0;
      for (const x of q) {
        const tf = t.filter((w) => w === x).length,
          df = ix.filter((a) => a.t.includes(x)).length;
        score +=
          (Math.log(1 + (docs.length - df + 0.5) / (df + 0.5)) * tf * 2.2) /
          (tf + 1.2 * (0.25 + (0.75 * t.length) / (avg || 1)));
      }
      return { ...d, score };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
