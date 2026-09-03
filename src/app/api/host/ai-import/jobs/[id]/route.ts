import { NextRequest, NextResponse } from "next/server";
import { getImportJob } from "@/lib/services/aiLister";

export const dynamic = "force-dynamic";

// Polling endpoint -- the Processing page calls this every ~1.5s until the
// job is no longer 'queued'/'processing'. See src/lib/services/aiLister.ts.
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const job = await getImportJob(params.id);
    return NextResponse.json({ data: job });
  } catch (err: any) {
    console.error("[/api/host/ai-import/jobs/:id] error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Could not fetch import status." }, { status: 500 });
  }
}
