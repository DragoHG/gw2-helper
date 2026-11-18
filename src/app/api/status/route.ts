import { NextResponse } from "next/server";
import { getStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(getStatus());
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao ler status",
      },
      { status: 500 },
    );
  }
}
