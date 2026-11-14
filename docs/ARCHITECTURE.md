# Architecture and engineering judgment

## Product boundary

The primary interface is an attention queue, not a chat screen. The investor first sees what changed, then opens evidence or asks a focused question. Routine exchange paperwork remains discoverable. Research output separates the document, reporting period, measurement basis and inference.

The Promise Ledger is a deliberately scoped historical analysis, not a generated chart pretending to cover every company. It compares four published FY25 Infosys guidance ranges with actual annual constant-currency growth. A 4.2% outcome versus the final 4.5–5% range means a 30-basis-point shortfall from the floor; it does not establish causality.

## Data paths

| Path               | Provider / transformation                                                                                        | State and failure behavior                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Market             | Yahoo chart API → completed daily bars → change and volume baseline                                              | 15-minute in-memory cache; dated initial snapshot retained on failure                |
| Disclosures        | NSE announcements → deduplication and IST normalization → ordered classification rules → watchlist/window filter | 5-minute cache; failed refresh shows an error                                        |
| Documents          | NSE annual-report and symbol announcements APIs → Screener original-document links when necessary                | 1-hour cache; URLs restricted to reviewed company/exchange hosts                     |
| Research           | Company PDF → unpdf page text → 1,500-character chunks / 1,200-character stride → lexical relevance ranking      | Page and document identity stay attached; empty match set abstains                   |
| Optional synthesis | Top six source chunks → Groq Llama 3.3 70B → constrained JSON → citation-ID/schema validation                    | Session-only key; failed model request retains evidence; uploaded files bypass model |
| Reviewed examples  | Short human/agent-reviewed paraphrases of dated primary documents                                                | Explicit snapshot/historical labels; never silently replace live results             |
| Personal state     | Alert rules, saved IDs and additional tickers                                                                    | Browser localStorage; single-browser prototype, no account synchronization           |

## Calculations

Daily change is `(latest close / previous close - 1) × 100`; zero denominator returns no result. The volume denominator is the arithmetic mean of the **20 bars preceding the latest bar**, excluding the latest volume. Fewer than 20 prior sessions produce no volume multiple. Absolute price threshold comparisons are inclusive, with a small floating-point tolerance. No corporate-action-adjusted total-return claim is made.

Exchange timestamps are interpreted as Asia/Kolkata (+05:30), then stored as ISO UTC. The digest includes `(start, end]`, excludes future records and only includes watched symbols. Priority sorts by category score, then recency. A routine-publication rule deliberately precedes results classification so newspaper publication notices do not masquerade as new earnings.

The default digest is 24 hours ending at the displayed snapshot time. A successful source refresh advances that anchor. Custom controls are interpreted in IST. This makes offline replay reproducible instead of silently claiming that old data covers the current wall-clock day.

## Source discipline

Prices use Yahoo, but company research uses only company-issued primary documents. Screener is a link directory, never the authority for generated analysis. Exchange-issued links are accepted for arbitrary NSE symbols, so discovery is not hard-coded to the examples. Direct company hosts require explicit review; PDF upload is the fallback for other hosts. No arbitrary URL input is exposed.

Reviewed examples include annual reports and transcripts where found; missing coverage is disclosed. Retrieved verbatim previews are short; the original page link carries the full context. Uploaded documents can be displayed at greater length because the user supplied them. Financial bases are not interchangeable: rupee growth, dollar growth and constant-currency growth are labelled; EBIT is not relabelled EBITDA; standalone cash flow is not paired with consolidated profit.

## Cost and runtime

The default workflow makes zero model calls. Bulk triage and numerical signals are deterministic. Retrieval sends at most six bounded chunks to the optional model. Responses are capped, and provider results use short in-memory TTLs rather than a vector database for this scope. Caches are ephemeral, per process/isolate, not globally consistent. The cache has eight entries; a production implementation should add byte-based limits and external document storage.

The app uses React/TypeScript on Vinext, with Cloudflare Worker routes. PDF downloads are capped at 20 MB, uploads at 12 MB, documents at 600 pages and extracted text at four million characters. Large PDF parsing can still approach Worker memory/CPU limits; an asynchronous extraction service is the next production step. Scanned PDFs are rejected rather than hallucinated.

## Failure, security and privacy boundaries

- Validate ticker shape; no arbitrary URLs, executable source schemes or redirect-following fetches.
- Download and provider timeouts, file-size limits, PDF magic check and page/text caps.
- Preserve errors and dates. Do not turn a failed source fetch into a false live success.
- Treat document instructions as untrusted data in the model prompt. Validate every output source ID; this does not solve semantic hallucination or all prompt injection.
- API keys stay in React session state and are sent only to the server for Groq requests; never put them in localStorage, exports, logs or the repository. Refreshing the page clears the key.
- The hosted prototype defaults to owner-private. A reviewer needs an explicit sharing change before submission.
- There is no multiuser authentication layer inside the app, persistent uploaded-document store, distributed rate limiter or server-side scheduler. Public production use would require those boundaries.

## What I would build next

1. Durable, incremental ingest with exchange cursors and retries, plus explicit source-health reporting.
2. Async PDF parsing, OCR and a byte-bounded evidence store with document hashes/versioning.
3. A financial fact schema that requires period, currency, unit, scope and accounting basis; reconcile arithmetic before presenting ratios.
4. Statement-level entailment evaluations and a held-out question set with scored abstention.
5. Closed-tab notification delivery and user accounts, preserving alert provenance and preferences.
