import { describe, expect, it } from "vitest";
import {
  filterSales,
  getDashboardSummary,
  getSalesTrend,
  type Sale,
} from "./dashboard-data";

const sales: Sale[] = [
  {
    id: "AX-1001",
    customer: "Alya Putri",
    product: "Starter Kit",
    date: "2026-10-03",
    amount: 450_000,
    status: "completed",
    channel: "Website",
  },
  {
    id: "AX-1002",
    customer: "Bima Pratama",
    product: "Growth Plan",
    date: "2026-10-04",
    amount: 1_200_000,
    status: "processing",
    channel: "WhatsApp",
  },
  {
    id: "AX-1003",
    customer: "Alya Putri",
    product: "Growth Plan",
    date: "2026-10-04",
    amount: 800_000,
    status: "cancelled",
    channel: "Instagram",
  },
  {
    id: "AX-1004",
    customer: "Citra Lestari",
    product: "Starter Kit",
    date: "2026-10-05",
    amount: 525_000,
    status: "completed",
    channel: "Website",
  },
];

describe("filterSales", () => {
  it("combines search, inclusive dates, and status instead of applying only one filter", () => {
    expect(
      filterSales(sales, {
        query: "growth",
        from: "2026-10-04",
        to: "2026-10-04",
        status: "processing",
      }).map(({ id }) => id),
    ).toEqual(["AX-1002"]);
  });

  it("returns no results for a reversed date range", () => {
    expect(
      filterSales(sales, { from: "2026-10-05", to: "2026-10-03" }),
    ).toEqual([]);
  });

  it("searches across customer, product, and order ID without case sensitivity", () => {
    expect(filterSales(sales, { query: "  ax-1004 ", status: "all" })).toEqual([
      sales[3],
    ]);
    expect(filterSales(sales, { query: "ALYA", status: "all" })).toEqual([
      sales[2],
      sales[0],
    ]);
  });

  it("returns transactions in newest-first order", () => {
    expect(filterSales(sales, { status: "all" }).map(({ id }) => id)).toEqual([
      "AX-1004",
      "AX-1002",
      "AX-1003",
      "AX-1001",
    ]);
  });
});

describe("getDashboardSummary", () => {
  it("excludes cancelled revenue and derives averages and completion rate from active orders", () => {
    expect(getDashboardSummary(sales)).toEqual({
      totalRevenue: 2_175_000,
      transactionCount: 4,
      activeTransactionCount: 3,
      averageOrderValue: 725_000,
      completedCount: 2,
      completionRate: 2 / 3,
    });
  });

  it("returns safe zero values when the filtered set is empty", () => {
    expect(getDashboardSummary([])).toEqual({
      totalRevenue: 0,
      transactionCount: 0,
      activeTransactionCount: 0,
      averageOrderValue: 0,
      completedCount: 0,
      completionRate: 0,
    });
  });
});

describe("getSalesTrend", () => {
  it("groups filtered revenue by date and keeps cancelled-only days at zero", () => {
    expect(
      getSalesTrend([
        sales[0],
        sales[1],
        sales[2],
        { ...sales[2], id: "AX-1005", date: "2026-10-06" },
      ]),
    ).toEqual([
      { date: "2026-10-03", revenue: 450_000, transactions: 1 },
      { date: "2026-10-04", revenue: 1_200_000, transactions: 1 },
      { date: "2026-10-06", revenue: 0, transactions: 0 },
    ]);
  });

  it("returns no chart points for an empty result", () => {
    expect(getSalesTrend([])).toEqual([]);
  });
});
