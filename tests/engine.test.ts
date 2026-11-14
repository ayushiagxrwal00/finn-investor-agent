import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ticker,
  change,
  signal,
  classify,
  normalize,
  digest,
  retrieve,
  safeLink,
  defaults,
  type Stock,
  type Filing,
  type Evidence,
} from "../lib/engine.ts";
import { validateClaims } from "../lib/synthesis.ts";
const stock: Stock = {
  symbol: "TEST",
  name: "Test",
  sector: "Test",
  source: "https://example.org",
  status: "ok",
  bars: Array.from({ length: 21 }, (_, i) => ({
    date: `2026-10-${i + 1}`,
    close: i === 20 ? 103 : 100,
    volume: i === 20 ? 200 : 100,
  })),
};
const d: Evidence = {
  id: "known",
  symbol: "INFY",
  title: "report",
  url: "https://example.org/report.pdf",
  page: 2,
  text: "Cash flow conversion improved. Growth guidance is three percent.",
  kind: "annual report",
  period: "FY25",
};
test("valid tickers and SSRF input rejection", () => {
  assert.equal(ticker(" m&m.ns "), "M&M");
  assert.throws(() => ticker("https://evil.com"));
  assert.throws(() => ticker("../api"));
});
test("price threshold is inclusive and negative moves alert", () => {
  assert.equal(signal(stock, defaults)?.priceAlert, true);
  assert.equal(
    signal(
      {
        ...stock,
        bars: [
          ...stock.bars.slice(0, -1),
          { date: "2026-10-21", close: 96, volume: 100 },
        ],
      },
      defaults,
    )?.priceAlert,
    true,
  );
});
test("volume uses preceding 20 bars, never current bar", () => {
  assert.equal(signal(stock, defaults)?.multiple, 2);
  assert.equal(signal(stock, defaults)?.volumeAlert, true);
});
test("short history and zero denominator abstain", () => {
  assert.equal(
    signal({ ...stock, bars: stock.bars.slice(-3) }, defaults)?.multiple,
    null,
  );
  assert.equal(change(100, 0), null);
  assert.equal(signal({ ...stock, bars: [] }, defaults), null);
});
test("routine results-publication ads stay low priority", () => {
  assert.equal(
    classify("Newspaper publication of financial results").score,
    15,
  );
  assert.equal(classify("Financial results").category, "results");
  assert.equal(classify("CFO resignation").category, "management_change");
});
test("NSE dates are IST, ids deduplicate, invalid dates omitted", () => {
  const r = {
    seq_id: "1",
    symbol: "INFY",
    sort_date: "2026-11-09 10:00:00",
    desc: "Results",
    attchmntFile: "https://nseindia.com/a.pdf",
  };
  const f = normalize([r, r, { ...r, seq_id: "2", sort_date: "bad" }]);
  assert.equal(f.length, 1);
  assert.equal(f[0].date, "2026-11-09T04:30:00.000Z");
});
test("digest is (start,end], watchlist-only, no future, priority sorted", () => {
  const make = (id: string, date: string, score: number, symbol = "INFY") =>
    ({ id, date, score, symbol }) as Filing;
  const fs = [
    make("old", "2026-11-08T12:00:00Z", 99),
    make("new", "2026-11-09T12:00:00Z", 60),
    make("future", "2026-11-10T12:00:00Z", 100),
    make("other", "2026-11-09T11:00:00Z", 99, "TCS"),
    make("important", "2026-11-09T10:00:00Z", 95),
  ];
  assert.deepEqual(
    digest(fs, 24, "2026-11-09T12:00:00Z", ["INFY"]).map((x) => x.id),
    ["important", "new"],
  );
});
test("retrieval finds relevant evidence and abstains on absent terms", () => {
  assert.equal(retrieve("cash", [d])[0].id, "known");
  assert.equal(retrieve("elephant", [d]).length, 0);
});
test("source links reject executable schemes", () => {
  assert.equal(safeLink("javascript:alert(1)"), "#");
  assert.equal(
    safeLink("https://nseindia.com/a.pdf"),
    "https://nseindia.com/a.pdf",
  );
});
test("model claims require known evidence and fact/inference labels", () => {
  assert.throws(() =>
    validateClaims(
      { claims: [{ kind: "fact", text: "x", sources: ["fake"] }] },
      [d],
    ),
  );
  assert.throws(() =>
    validateClaims(
      { claims: [{ kind: "guess", text: "x", sources: ["known"] }] },
      [d],
    ),
  );
  assert.equal(
    validateClaims(
      { claims: [{ kind: "fact", text: "Cash improved", sources: ["known"] }] },
      [d],
    ).length,
    1,
  );
});
