import { NextResponse } from "next/server";
import { getReadiness } from "@/lib/sales-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await getReadiness();
  return NextResponse.json(readiness, {
    status: readiness.ready ? 200 : 503,
  });
}
