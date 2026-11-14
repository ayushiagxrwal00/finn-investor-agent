# AI build history — factual development log

This is a concise build log reconstructed from the working session. **It is not a verbatim conversation export and does not satisfy the brief's AI-history requirement by itself.** Attach the actual ChatGPT conversation export or a share link before submission. Do not invent a conversation URL.

## Brief and scope

The supplied ENAM main brief and companion financial glossary were read. The product scope chosen was an 18-company investor brief, configurable EOD alerts, primary-document research and a differentiated Infosys FY25 Promise Ledger. The user requested end-to-end preparation, selected Sites, connected GitHub and asked to continue.

## Implementation

- Used genuine Yahoo EOD history and NSE corporate announcements; retained retrieval timestamps and original URLs.
- Inspected company annual reports and exchange-filed transcripts for Infosys, TCS, Wipro, ITC and Persistent. ITC transcript and Persistent annual-report coverage were incomplete and disclosed.
- Built the responsive workspace, priority rules, date-window logic, saved evidence, configurable thresholds, PDF extraction, relevance ranking and optional cited model synthesis.
- Kept the historical Infosys narrative-versus-numbers case distinct from the current market snapshot.
- Corrected PDF cleanup to use the parser loading task's destroy method.
- A workspace-maintenance pause removed the uncommitted app directory. Downloaded primary documents survived. The app was restored in the conversation workspace, with subsequent source synchronization/checkpointing.
- Added tests for calculations, dates, deduplication, malicious ticker input, source links, retrieval abstention and unsupported model citations.
- Browser-tested the desktop and 390-pixel mobile layouts. Live source discovery worked in a direct Node check but failed in the local Worker preview. Dated source-reviewed examples and PDF upload were retained as explicit alternative paths.

## Honest boundaries

No real Groq key was supplied or used. No submission email was sent. GitHub connection status is distinct from GitHub repository creation: the available connector can write repository files but does not offer repository creation. Final repository/access and conversation-export steps are tracked in SUBMISSION.md.

## Required attachment from the candidate

Export/share the real build conversation, including scope decisions, debugging, tests, failures and revisions. Review the export for credentials and irrelevant personal information before sharing. Keep this development log as an index, not as replacement evidence.
