import { NextResponse } from "next/server";
import { getSalesData, getSalesDataSource } from "@/lib/sales-repository";
import { withMetrics } from "@/lib/with-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withMetrics("/api/sales", async () => {
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
});
