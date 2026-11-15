# Submission checklist and covering email

Deadline in the brief: **15 November 2026**.

## Before sending

- [ ] Confirm the deployed prototype opens on your phone.
- [ ] Grant ENAM reviewers access: the initial hosted version is owner-private.
- [ ] Add the GitHub repository URL and ensure reviewers can access it.
- [ ] Attach/link the actual AI build conversation export or share link.
- [ ] Replace the marked URLs in the draft below.
- [ ] Send the email yourself after reviewing the contents. No email has been sent by the assistant.

## Email draft

To: assessment@enam.com  
Subject: IIT Delhi – AI Engineer - 2027

Dear ENAM Team,

Please find my FINN prototype for the AI Engineer Build Challenge.

Prototype: https://finn-investor-desk-ayushi.ayushithegreat519.chatgpt.site 
GitHub: https://github.com/ayushiagxrwal00/finn-investor-agent  
AI build history: https://chatgpt.com/share/6af9d87a-5f54-83e8-986a-8108408e802c

I focused on two investor workflows: a prioritized daily brief across an 18-company NSE portfolio, and primary-source research that keeps the evidence close to the conclusion. The brief has configurable date windows, price/volume thresholds and disclosure categories. The research desk supports company-document retrieval and PDF upload, with five dated examples. The Promise Ledger compares Infosys' FY25 guidance changes with actual growth rather than simply repeating management commentary.

The core experience uses deterministic rules, cached data and lexical retrieval, so it requires no paid model calls. Optional Groq synthesis uses only retrieved primary-document passages and validates citation IDs. Facts, interpretation, reporting periods and missing data are visibly separated. Source failures retain dated evidence rather than fabricating a fresh answer.

I deliberately left out universal financial-statement extraction, OCR, closed-tab notifications and trading recommendations. Live source access can be restricted; the prototype exposes that limitation and offers reviewed snapshots and user-supplied documents. Next I would add durable ingest, asynchronous extraction, reconciled financial facts and a held-out evaluation set for evidence support and abstention.

The repository includes setup instructions, architecture notes, test results and a short demo guide. The attached/shared AI conversation records the actual build process.

Regards,  
Ayushi Agrawal  
IIT Delhi
