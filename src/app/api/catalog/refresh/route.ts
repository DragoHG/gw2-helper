import { NextRequest, NextResponse } from "next/server";
import { refreshCatalog } from "@/lib/catalog/refresh";
import { loadCatalogMeta } from "@/lib/catalog/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ meta: loadCatalogMeta() });
}

export async function POST(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("force") === "1";
  const result = await refreshCatalog({ force });
  if (result.error && !result.waypointCount) {
    return NextResponse.json({ ok: false, ...result }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...result, meta: loadCatalogMeta() });
}
