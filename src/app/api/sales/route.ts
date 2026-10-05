import { NextResponse } from "next/server";
import { getSalesData, getSalesDataSource } from "@/lib/sales-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getSalesData());
  } catch {
    const source = getSalesDataSource();
    return NextResponse.json(
      {
        error: "Data penjualan tidak tersedia. Coba lagi.",
        ...(source ? { source } : {}),
      },
      { status: 503 },
    );
  }
}
