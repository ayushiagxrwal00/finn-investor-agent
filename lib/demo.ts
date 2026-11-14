import type { Evidence } from "./engine";
const root =
  "https://www.infosys.com/investors/reports-filings/quarterly-results/2024-2025/";
export const guidance = [
  {
    label: "Start of FY25",
    range: "1–3%",
    mid: 2,
    url: "https://www.infosys.com/investors/reports-filings/quarterly-results/2023-2024/q4/documents/transcripts/earningscall.pdf",
  },
  {
    label: "After Q1",
    range: "3–4%",
    mid: 3.5,
    url: root + "q1/documents/transcripts/earningscall.pdf",
  },
  {
    label: "After Q2",
    range: "3.75–4.5%",
    mid: 4.125,
    url: root + "q2/documents/transcripts/earningscall.pdf",
  },
  {
    label: "After Q3",
    range: "4.5–5%",
    mid: 4.75,
    url: root + "q3/documents/transcripts/earningscall.pdf",
  },
];
export const demo: Evidence[] = [
  {
    id: "infy-call",
    symbol: "INFY",
    title: "Infosys Q4 FY25 earnings call",
    url: root + "q4/documents/transcripts/earningscall.pdf",
    page: 5,
    kind: "transcript",
    period: "17 Apr 2025 · historical",
    text: "FY25 revenue grew 4.2% in constant currency. Q4 declined 3.5% sequentially: management attributed roughly two-thirds of the fall to third-party revenue and the rest to volume and seasonal factors. Free cash flow for FY25 was $4.1 billion, 129% of net profit; excluding tax refunds, conversion was 112%. DSO fell five days sequentially to 69. FY26 growth guidance was 0–3% in constant currency, with operating-margin guidance of 20–22% (pages 4–8). Interpretation: cash conversion was strong, but separate tax refunds from recurring cash generation and monitor deal conversion.",
  },
  {
    id: "infy-results",
    symbol: "INFY",
    title: "Infosys Q4 FY25 IFRS INR results",
    url: root + "q4/documents/ifrs-inr-press-release.pdf",
    page: 6,
    kind: "results",
    period: "17 Apr 2025 · historical",
    text: "Consolidated Q4 revenue was ₹40,925 crore versus ₹37,923 crore a year earlier. Operating profit was ₹8,575 crore; PBT ₹9,663 crore; PAT attributable to shareholders ₹7,033 crore. Prior-year PBT and PAT were ₹10,240 crore and ₹7,969 crore. FY25 revenue was ₹162,990 crore. Operating profit is not EBITDA. Tax-related income affects year-on-year profit comparability.",
  },
  {
    id: "infy-annual",
    symbol: "INFY",
    title: "Infosys integrated annual report FY24",
    url: "https://www.infosys.com/investors/reports-filings/annual-report/annual/documents/infosys-ar-24.pdf",
    page: 1,
    kind: "annual report",
    period: "FY24 · document-level reference",
    text: "Infosys provides consulting and technology services. Its annual report covers business segments, consolidated financial statements, risks and accounting policies. Consolidated cash and investments at March 2024 were ₹39,005 crore. From FY25, the capital allocation policy targets returning approximately 85% of cumulative free cash flow over five years, subject to applicable approvals. Distinguish cash, investments, lease liabilities and borrowings; cash alone is not a leverage ratio.",
  },
];
export const metrics = [
  ["Q4 revenue", "₹40,925 cr", "IFRS consolidated"],
  ["Operating margin", "21.0%", "Not EBITDA margin"],
  ["FY25 CC growth", "4.2%", "vs final 4.5–5% guidance"],
  ["FCF / net profit", "129%", "112% excluding tax refunds"],
];
