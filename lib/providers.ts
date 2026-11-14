import { ticker, type Evidence } from "./engine.ts";
const cache = new Map<string, { expiry: number; value: any }>();
async function memo<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = 900000,
): Promise<T> {
  const c = cache.get(key);
  if (c && c.expiry > Date.now()) return c.value;
  const value = await fn();
  if (cache.size >= 8) cache.delete(cache.keys().next().value!);
  cache.set(key, { value, expiry: Date.now() + ttl });
  return value;
}
async function bytes(url: string, max = 20_000_000) {
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json,text/html,application/pdf,*/*",
      Referer: "https://www.nseindia.com/",
    },
    signal: AbortSignal.timeout(30000),
    redirect: "error",
  });
  if (!r.ok) throw Error(`Source returned HTTP ${r.status}`);
  if (Number(r.headers.get("content-length")) > max)
    throw Error("Document exceeds download limit.");
  const reader = r.body!.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw Error("Document exceeds download limit.");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}
const getText = async (u: string) => new TextDecoder().decode(await bytes(u));
const date = (d: Date) =>
  `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
export async function prices(input: string) {
  const s = ticker(input);
  return memo("p:" + s, async () => {
    const source = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}.NS?range=3mo&interval=1d`;
    const j = JSON.parse(await getText(source));
    const d = j.chart?.result?.[0];
    if (!d) throw Error("No price history for this ticker.");
    const q = d.indicators.quote[0],
      now = new Date(),
      today = now.toISOString().slice(0, 10);
    return {
      symbol: s,
      name: d.meta.longName || s,
      sector: "Added company",
      source,
      status: "ok",
      bars: d.timestamp.flatMap((ts: number, i: number) => {
        const dt = new Date(ts * 1000).toISOString().slice(0, 10);
        return q.close[i] != null &&
          q.volume[i] != null &&
          (dt < today || now.getUTCHours() >= 10)
          ? [{ date: dt, close: q.close[i], volume: q.volume[i] }]
          : [];
      }),
    };
  });
}
export async function announcements() {
  return memo(
    "ann",
    async () => {
      const now = new Date();
      const j = JSON.parse(
        await getText(
          `https://www.nseindia.com/api/corporate-announcements?index=equities&from_date=${date(new Date(+now - 30 * 864e5))}&to_date=${date(now)}`,
        ),
      );
      if (!Array.isArray(j)) throw Error("NSE feed unavailable");
      return j;
    },
    300000,
  );
}
export type DocumentLink = {
  title: string;
  url: string;
  kind: string;
  period: string;
};
export function discoverHtml(html: string): DocumentLink[] {
  const out: DocumentLink[] = [];
  for (const [m, k] of [
    ["documents annual-reports", "annual report"],
    [">Concalls<", "transcript"],
  ]) {
    const start = html.indexOf(m);
    if (start < 0) continue;
    for (const a of html
      .slice(start, start + 35000)
      .matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
      const u = a[1].match(/href=["']([^"']+)/)?.[1],
        label = a[2].replace(/<[^>]*>/g, " ").trim();
      if (
        !u ||
        !(k === "annual report"
          ? /^Annual Report \d{4}$/.test(label)
          : label === "Transcript")
      )
        continue;
      let url = u.replaceAll("&amp;", "&");
      try {
        const v = new URL(url);
        if (v.protocol !== "https:") continue;
        const p = v.searchParams.get("Pname");
        if (
          v.hostname === "www.bseindia.com" &&
          p &&
          /^[a-f0-9-]+\.pdf$/i.test(p)
        )
          url = "https://www.bseindia.com/xml-data/corpfiling/AttachHis/" + p;
      } catch {
        continue;
      }
      out.push({ title: label, url, kind: k, period: "Check document date" });
      break;
    }
  }
  return out;
}
export async function discover(input: string) {
  const s = ticker(input);
  return memo(
    "d:" + s,
    async () => {
      const now = new Date(),
        enc = encodeURIComponent(s);
      const res = await Promise.allSettled([
        getText(
          `https://www.nseindia.com/api/annual-reports?index=equities&symbol=${enc}`,
        ),
        getText(
          `https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=${enc}&from_date=${date(new Date(+now - 365 * 864e5))}&to_date=${date(now)}`,
        ),
      ]);
      const links: DocumentLink[] = [];
      if (res[0].status === "fulfilled") {
        const j = JSON.parse(res[0].value),
          rows = Array.isArray(j) ? j : j.data;
        const r = rows?.find((r: any) =>
          r.fileName?.toLowerCase().endsWith(".pdf"),
        );
        if (r)
          links.push({
            title: `${s} annual report ${r.fromYr}–${r.toYr}`,
            url: r.fileName,
            kind: "annual report",
            period: `FY${r.fromYr}–${r.toYr}`,
          });
      }
      if (res[1].status === "fulfilled") {
        const j = JSON.parse(res[1].value);
        if (Array.isArray(j)) {
          const r = j
            .filter(
              (r: any) =>
                r.symbol === s &&
                /transcript/i.test(r.desc + " " + r.attchmntText) &&
                !/agm|annual general|ai day/i.test(
                  r.desc + " " + r.attchmntText,
                ),
            )
            .sort((a: any, b: any) =>
              String(b.sort_date).localeCompare(String(a.sort_date)),
            )[0];
          if (r)
            links.push({
              title: `${s} earnings-call transcript`,
              url: r.attchmntFile,
              kind: "transcript",
              period: r.an_dt + " IST",
            });
        }
      }
      if (links.length < 2) {
        try {
          const html = await getText(
            `https://www.screener.in/company/${enc}/consolidated/`,
          );
          for (const l of discoverHtml(html))
            if (!links.some((x) => x.kind === l.kind)) links.push(l);
        } catch {}
      }
      if (!links.length)
        throw Error(
          "No primary documents found or source hosts unavailable. Upload a company PDF.",
        );
      return links;
    },
    3600000,
  );
}
const primary = (url: string) => {
  const h = new URL(url).hostname;
  return [
    "nseindia.com",
    "bseindia.com",
    "infosys.com",
    "tcs.com",
    "wipro.com",
    "itcportal.com",
  ].some((d) => h === d || h.endsWith("." + d));
};
export async function extractPdf(
  data: Uint8Array,
  symbol: string,
  l: DocumentLink,
): Promise<Evidence[]> {
  const { getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(data, { maxImageSize: 1024 });
  const docs: Evidence[] = [];
  try {
    if (pdf.numPages > 600) throw Error("PDF exceeds 600-page limit.");
    let chars = 0;
    for (let page = 1; page <= pdf.numPages; page++) {
      const p = await pdf.getPage(page),
        c = await p.getTextContent();
      const t = c.items
        .map((x: any) => x.str || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      chars += t.length;
      if (chars > 4_000_000)
        throw Error("Document text exceeds processing limit.");
      for (let i = 0; i < t.length; i += 1200)
        if (t.slice(i, i + 1500).length > 80)
          docs.push({
            id: `${symbol}-${l.kind}-${page}-${i}`,
            symbol,
            ...l,
            page,
            text: t.slice(i, i + 1500),
          });
      p.cleanup();
    }
  } finally {
    await pdf.loadingTask.destroy();
  }
  if (!docs.length) throw Error("No readable text; scanned PDFs require OCR.");
  return docs;
}
export async function primaryEvidence(input: string) {
  const s = ticker(input);
  return memo(
    "e:" + s,
    async () => {
      const links = await discover(s),
        evidence: Evidence[] = [],
        errors: string[] = [];
      for (const l of links) {
        try {
          if (!primary(l.url))
            throw Error("Unreviewed document host. Use PDF upload.");
          evidence.push(...(await extractPdf(await bytes(l.url), s, l)));
        } catch (e) {
          errors.push(
            l.title + ": " + (e instanceof Error ? e.message : "unavailable"),
          );
        }
      }
      return { links, evidence, errors };
    },
    3600000,
  );
}
