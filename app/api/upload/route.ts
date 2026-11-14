import { extractPdf } from "@/lib/providers";
import { ticker, retrieve } from "@/lib/engine";
export async function POST(req: Request) {
  try {
    if (Number(req.headers.get("content-length")) > 12_100_000)
      throw Error("PDF upload exceeds 12 MB");
    const f = await req.formData(),
      file = f.get("file");
    if (!(file instanceof File) || file.size > 12_000_000)
      throw Error("Choose a PDF under 12 MB");
    const symbol = ticker(String(f.get("symbol"))),
      query = String(f.get("query") || "cash revenue guidance").slice(0, 600),
      bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
      throw Error("Not a PDF file");
    const d = await extractPdf(bytes, symbol, {
      title: file.name,
      url: "",
      kind: "user-supplied document",
      period: "Verify issuer and date",
    });
    return Response.json({
      symbol,
      query,
      mode: "uploaded PDF",
      answer:
        "Matched passages from your document. Verify that it is company-issued.",
      evidence: retrieve(query, d, 5),
      errors: [],
      pagesIndexed: new Set(d.map((x) => x.page)).size,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
