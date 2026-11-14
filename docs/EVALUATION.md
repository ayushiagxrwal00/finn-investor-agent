# Verification record

Verified during the 9–10 November 2026 build session. This is a prototype verification record, not a benchmark claiming general financial accuracy.

| Check | Observed result |
|---|---|
| Core regression suite | 10 tests passed: ticker validation, inclusive price alerts, prior-20-session volume, sparse history/zero denominator, routine classification, IST dates/deduplication, window boundaries/priority, evidence retrieval/abstention, safe source links, model citation/schema rejection |
| TypeScript | `tsc --noEmit` passed after UI integration |
| Production build | Vinext/Cloudflare Worker build completed successfully |
| Market snapshot | 18 companies; 278 NSE announcement records; retrieved 2026-11-09T21:26:20Z; dates retained per bar/filing |
| Actual PDF extraction | Wipro exchange transcript produced 42 text chunks across 16 PDF pages in a Node smoke check |
| Generic document discovery | Direct Node `discover('WIPRO')` returned annual-report and earnings-call PDF links |
| Desktop browser | Dashboard rendered; research navigation and INFY historical source results worked |
| Mobile browser | 390 × 844 iframe review showed stacked cards, readable inbox and fixed bottom navigation |
| Reviewed Wipro research | Browser displayed the source-reviewed cash/guidance note, date, evidence ID and PDF page link |
| Live research in local preview | Failed source discovery; an explicit error appeared. No fabricated live answer was substituted |
| Browser PDF upload | Test stalled and was interrupted; end-to-end upload is not verified. Parser component passed separately |
| Optional Groq synthesis | Implemented but not exercised with a real key. Schema/citation validation tested independently |
| Generalization | Generic NSE ticker path implemented; not exhaustively tested across all issuers or source hosts |

## Known limitations worth testing next

1. Provider availability in the production Worker can differ from Node and the preview environment. Test live annual reports/transcripts and a non-example ticker after deployment.
2. Large annual reports may approach Worker CPU/memory limits despite download/page/text caps. Move extraction to an asynchronous job service for production.
3. Lexical retrieval can miss paraphrases and return coincidental word matches. A semantic relevance/entailment evaluation set is needed before treating output as research-grade.
4. Category scoring uses title/body patterns and has no measured precision/recall. It can miss disclosures or over-prioritize ambiguous language.
5. Reviewed snapshots are intentionally narrow. ITC standalone cash flow must not be compared to consolidated earnings; Persistent lacks annual-report notes. No unsupported ratios are filled in.
6. Alerts refresh only while the tab is visible. No background scheduler, email, mobile push or new-event delivery log exists.
7. Preferences/bookmarks are local to one browser. Saved IDs can become unavailable if their filing is outside a later fetched feed. A durable evidence store is needed for long-term research.
8. Market moves are unadjusted close-to-close changes. Corporate actions can create misleading alerts; the prototype does not claim total-return analytics.
9. Citation membership checks establish traceability, not semantic support. Optional AI output still requires review of the original document.

## Manual acceptance steps

Open a longer date window; expand routine items; save/unsave a filing; modify thresholds; inspect dated portfolio data; run INFY and WIPRO reviewed research; verify source PDFs; try live research and upload; reload and confirm local preferences; export evidence; open the deployed URL on an actual phone. Record live-source and upload outcomes honestly before submission.
