import { ticker, retrieve } from "@/lib/engine";
import { primaryEvidence } from "@/lib/providers";
import { synthesize } from "@/lib/synthesis";
export async function POST(req: Request) {
  try {
    if (Number(req.headers.get("content-length")) > 5000)
      throw Error("Request too large");
    const b: any = await req.json(),
      symbol = ticker(String(b.symbol || "")),
      query = String(b.query || "cash revenue guidance").slice(0, 600);
    const d = await primaryEvidence(symbol),
      matches = retrieve(query, d.evidence, 6);
    let claims: any[] = [],
      mode = "extractive";
    const errors = [...d.errors];
    if (b.apiKey && matches.length) {
      try {
        claims = await synthesize(
          query,
          matches,
          String(b.apiKey).slice(0, 250),
        );
        mode = "AI synthesis";
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Model unavailable");
      }
    }
    const seen = new Set<string>();
    const evidence = matches.map((x) => {
      const first = !seen.has(x.url);
      seen.add(x.url);
      return {
        ...x,
        text: first
          ? x.text.split(/\s+/).slice(0, 24).join(" ") + "…"
          : "Additional matching passage; read the cited page for context.",
      };
    });
    return Response.json({
      symbol,
      query,
      mode,
      claims,
      evidence,
      links: d.links,
      errors,
      pagesIndexed: new Set(d.evidence.map((x) => x.url + ":" + x.page)).size,
      answer: evidence.length
        ? "Relevant primary-source passages found. Read the cited pages to verify context."
        : "Insufficient evidence. Try another question or upload a company PDF.",
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Research unavailable" },
      { status: 502 },
    );
  }
}
