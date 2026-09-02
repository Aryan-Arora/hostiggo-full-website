import { NextRequest, NextResponse } from "next/server";
import { createImportJob, runImportWorker } from "@/lib/services/aiLister";

export const dynamic = "force-dynamic";

// Creates an import job for one source URL and kicks off processing. Real
// calls to the AI-lister service (github.com/Hostiggo-Codebase/AI-lister,
// deployed on Railway) -- see src/lib/services/aiLister.ts.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = String(body?.url ?? "").trim();
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Enter a valid listing URL" }, { status: 400 });
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Enter a valid listing URL" }, { status: 400 });
    }

    const job = await createImportJob(url);
    // This deployment processes synchronously within the worker call (see
    // the comment on runImportWorker) -- kick it off here so the client's
    // first poll already has real progress instead of racing an empty
    // 'queued' job.
    const processed = await runImportWorker(job.id).catch((err) => {
      // The job was created either way -- if triggering the worker fails
      // (network blip, cold start), the client can still poll for it and
      // retry the worker call via a second request if needed.
      console.error("[/api/host/ai-import/jobs] worker trigger failed:", err?.message);
      return job;
    });

    return NextResponse.json({ data: processed });
  } catch (err: any) {
    console.error("[/api/host/ai-import/jobs] error:", err?.message);
    return NextResponse.json(
      { error: err?.message ?? "Could not start the import." },
      { status: 500 },
    );
  }
}
