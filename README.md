# FINN · Investor intelligence

**Prototype:** https://finn-investor-desk-ayushi.ayushithegreat519.chatgpt.site

**Repository:** https://github.com/ayushiagxrwal00/finn-investor-agent

A mobile-first investor workspace for the ENAM AI Engineer Build Challenge, IIT Delhi 2027.

FINN makes two workflows concrete: **a quiet, prioritized daily brief** and **primary-source research with traceable evidence**. Its distinguishing view is the Promise Ledger: Infosys' FY25 growth guidance compared with the eventual outcome, with the original management calls one tap away.

## Run locally

Requires Node 22.13+ (Node 24 recommended), npm and Python 3 for the optional data-refresh script.

```sh
npm ci
npm run dev
```

Open the URL printed by the development server. A dated market snapshot and five reviewed research examples work without API keys or external data access. Source hosts can reject server requests; those errors are shown, never disguised as a successful refresh.

```sh
npm test
npm run typecheck
npm run build
```

The repository retains the supplied Vinext/Cloudflare build integration. The production entry is a Worker, not a static HTML export. `npm run start` serves the built Worker locally. See `docs/ARCHITECTURE.md` for boundaries and deployment options.

## Try it in three minutes

1. Start with the default 24-hour brief. Change the window to seven days, inspect high-priority filings, then expand routine disclosures.
2. Save a filing and open its original NSE PDF. Open Preferences to change price, volume and disclosure-category rules.
3. Visit My portfolio: 18 companies across banking, IT, consumer, energy, industrials and smaller businesses. Every close has a trading date and source link. Add another NSE ticker when the live provider is reachable.
4. Open Research desk. Try INFY cash conversion and the Promise Ledger. Compare TCS, WIPRO, ITC or PERSISTENT using the dated reviewed notes.
5. Choose **Fetch latest company PDFs** for live annual-report/transcript discovery. For another NSE ticker, Run research uses the same generic pipeline. If a source is unavailable, upload a company-issued text PDF under 12 MB.
6. Export the evidence bundle as JSON, including source links, periods, portfolio snapshot and alert rules.

## What is implemented

- 18-stock portfolio with genuine dated Yahoo EOD prices and volume; current-session partial bars are excluded before market close.
- Genuine NSE disclosures, deduplication, IST timestamps, configurable (start, end] digest, priority rules and collapsed routine items.
- User-configurable absolute price move and volume / previous 20-session average. Disclosure categories are visibly flagged by the user's rules.
- Optional refresh every five minutes **while the tab is open and visible**. No claim of closed-tab or real-time push delivery.
- Five reviewed research examples: INFY's historical FY25 case; TCS, WIPRO, ITC and PERSISTENT snapshots from documents retrieved on 9 November 2026. Missing documents/metrics are stated.
- Generic NSE-symbol document discovery through NSE, plus original document links discovered on Screener. No Screener AI summaries, broker notes or news are used for research.
- Server-side PDF text extraction, page-preserving overlapping chunks, lexical retrieval and abstention when evidence is insufficient.
- Optional Groq synthesis with a session-only key in Preferences. No key is required for the core product. The synthesis output must use supplied evidence IDs and label facts versus inference.
- Local-browser preferences/bookmarks, responsive bottom navigation and exportable evidence.

## Deliberate limits

This is a prototype, not an autonomous trading system. Deterministic disclosure priority is a transparent review heuristic, not measured investment materiality. It does not extract arbitrary financial statements reliably into a universal model, reconcile corporate actions, perform OCR, or generate investment recommendations.

Live endpoints can block requests or time out. The reviewed examples and dated market snapshot keep the core workflow available; they are not presented as live data. Documents outside the reviewed host allowlist can be uploaded. BSE-only symbol lookup is not implemented. ITC has an annual-report example but no transcript in the sampled feed; PERSISTENT has a transcript example but no bundled annual-report notes.

Optional model synthesis has **not** been tested with a real API key. Citation-ID validation checks membership and schema; it cannot prove that a claim follows from its source. Human source review remains essential. Full details and verification status are in `docs/EVALUATION.md`.

## Submission files

- `docs/SUBMISSION.md`: covering email draft and remaining submission steps.
- `docs/DEMO_SCRIPT.md`: timed walkthrough.
- `docs/ARCHITECTURE.md`: system design and trade-offs.
- `docs/EVALUATION.md`: checks, evidence and limitations.
- `docs/AI_BUILD_HISTORY.md`: factual build log, **not a substitute for the actual AI conversation export/share link** required by the brief.

No credentials or complete third-party company PDFs are bundled. Primary documents remain linked at their original publishers. Data snapshots and research paraphrases are clearly dated.
