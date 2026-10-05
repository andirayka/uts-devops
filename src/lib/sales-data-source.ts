import type { Sale, SaleStatus } from "./dashboard-data";

export type SalesDataSource = "demo" | "postgres";

export type SalesProviders<T> = {
  demo: () => T | Promise<T>;
  postgres: () => T | Promise<T>;
};

const INVALID_ROW_MESSAGE = "Invalid sales row returned by PostgreSQL";

export function parseDataSource(value: string | undefined): SalesDataSource {
  const source = value?.trim() || "demo";
  if (source === "demo" || source === "postgres") {
    return source;
  }

  throw new Error("DATA_SOURCE must be either demo or postgres");
}

export function validateDatabaseUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error("DATABASE_URL is required when DATA_SOURCE=postgres");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }

  if (
    (url.protocol !== "postgres:" && url.protocol !== "postgresql:") ||
    !url.hostname ||
    url.pathname.length < 2
  ) {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }

  return value.trim();
}

export function readSalesForSource<T>(
  source: SalesDataSource,
  providers: SalesProviders<T>,
): T | Promise<T> {
  return source === "demo" ? providers.demo() : providers.postgres();
}

export function mapPostgresSale(row: unknown): Sale {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error(INVALID_ROW_MESSAGE);
  }

  const value = row as Record<string, unknown>;
  const { id, customer, product, date, amount, status, channel } = value;

  if (
    typeof id !== "string" ||
    !id ||
    typeof customer !== "string" ||
    !customer ||
    typeof product !== "string" ||
    !product ||
    typeof channel !== "string" ||
    !channel ||
    typeof date !== "string" ||
    !isIsoDate(date) ||
    !isSaleStatus(status)
  ) {
    throw new Error(INVALID_ROW_MESSAGE);
  }

  const numericAmount =
    typeof amount === "number"
      ? amount
      : typeof amount === "string" && /^(0|[1-9]\d*)$/.test(amount)
        ? Number(amount)
        : Number.NaN;

  if (
    !Number.isSafeInteger(numericAmount) ||
    numericAmount < 0 ||
    (typeof amount === "number" && !Number.isFinite(amount))
  ) {
    throw new Error(INVALID_ROW_MESSAGE);
  }

  return { id, customer, product, date, amount: numericAmount, status, channel };
}

function isSaleStatus(value: unknown): value is SaleStatus {
  return value === "completed" || value === "processing" || value === "cancelled";
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
