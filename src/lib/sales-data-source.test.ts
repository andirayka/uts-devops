import { describe, expect, it, vi } from "vitest";
import { DEMO_SALES } from "./dashboard-data";
import {
  mapPostgresSale,
  parseDataSource,
  readSalesForSource,
  validateDatabaseUrl,
  type SalesDataSource,
} from "./sales-data-source";

describe("parseDataSource", () => {
  it("defaults an unset source to the runnable demo", () => {
    expect(parseDataSource(undefined)).toBe("demo");
  });

  it("accepts the two explicit source modes", () => {
    expect(parseDataSource("demo")).toBe("demo");
    expect(parseDataSource("postgres")).toBe("postgres");
  });

  it("rejects unknown modes without echoing their value", () => {
    expect(() => parseDataSource("postgres://user:password@host/db")).toThrow(
      "DATA_SOURCE must be either demo or postgres",
    );
  });
});

describe("validateDatabaseUrl", () => {
  it("accepts a PostgreSQL URL without revealing it in errors", () => {
    const databaseUrl = "postgresql://axon:secret@localhost:5432/axon_sales";
    expect(validateDatabaseUrl(databaseUrl)).toBe(databaseUrl);
  });

  it("rejects missing, malformed, and non-PostgreSQL URLs", () => {
    expect(() => validateDatabaseUrl(undefined)).toThrow(
      "DATABASE_URL is required when DATA_SOURCE=postgres",
    );
    expect(() => validateDatabaseUrl("not a URL with password=secret")).toThrow(
      "DATABASE_URL must be a valid PostgreSQL URL",
    );
    expect(() => validateDatabaseUrl("https://user:secret@example.test/db")).toThrow(
      "DATABASE_URL must be a valid PostgreSQL URL",
    );
  });
});

describe("mapPostgresSale", () => {
  it("maps a whole-IDR numeric value and preserves the ISO date and status", () => {
    expect(
      mapPostgresSale({
        id: "AX-2401",
        customer: "CV Sinar Nusantara",
        product: "Starter Kit",
        date: "2026-10-05",
        amount: "1250000",
        status: "completed",
        channel: "Website",
      }),
    ).toEqual({
      id: "AX-2401",
      customer: "CV Sinar Nusantara",
      product: "Starter Kit",
      date: "2026-10-05",
      amount: 1_250_000,
      status: "completed",
      channel: "Website",
    });
  });

  it("rejects fractional, unsafe, and malformed amounts", () => {
    for (const amount of ["1250000.5", "9007199254740992", "not-a-number"]) {
      expect(() =>
        mapPostgresSale({
          id: "AX-2401",
          customer: "CV Sinar Nusantara",
          product: "Starter Kit",
          date: "2026-10-05",
          amount,
          status: "completed",
          channel: "Website",
        }),
      ).toThrow("Invalid sales row returned by PostgreSQL");
    }
  });

  it("rejects malformed dates and statuses", () => {
    const sale = {
      id: "AX-2401",
      customer: "CV Sinar Nusantara",
      product: "Starter Kit",
      date: "2026-02-30",
      amount: "1250000",
      status: "completed",
      channel: "Website",
    };

    expect(() => mapPostgresSale(sale)).toThrow(
      "Invalid sales row returned by PostgreSQL",
    );
    expect(() =>
      mapPostgresSale({ ...sale, date: "2026-10-05", status: "pending" }),
    ).toThrow("Invalid sales row returned by PostgreSQL");
  });
});

describe("readSalesForSource", () => {
  it("reads demo fixtures only when demo mode is selected", async () => {
    const demo = vi.fn(async () => ["demo"]);
    const postgres = vi.fn(async () => ["database"]);

    await expect(
      readSalesForSource("demo", { demo, postgres } satisfies Record<SalesDataSource, () => Promise<string[]>>),
    ).resolves.toEqual(["demo"]);
    expect(demo).toHaveBeenCalledOnce();
    expect(postgres).not.toHaveBeenCalled();
  });

  it("does not silently fall back to demo when PostgreSQL fails", async () => {
    const demo = vi.fn(async () => ["demo"]);
    const postgres = vi.fn(async () => {
      throw new Error("database password must not be returned");
    });

    await expect(
      readSalesForSource("postgres", { demo, postgres } satisfies Record<SalesDataSource, () => Promise<string[]>>),
    ).rejects.toThrow("database password must not be returned");
    expect(demo).not.toHaveBeenCalled();
  });
});
