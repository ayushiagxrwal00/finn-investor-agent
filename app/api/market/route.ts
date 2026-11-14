import { prices, announcements } from "@/lib/providers";
export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    return Response.json(
      u.searchParams.get("type") === "filings"
        ? { rows: await announcements(), fetchedAt: new Date().toISOString() }
        : {
            stock: await prices(u.searchParams.get("symbol") || "INFY"),
            fetchedAt: new Date().toISOString(),
          },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Source unavailable" },
      { status: 502 },
    );
  }
}
