import "server-only";
import { Pool } from "pg";
import { DEMO_SALES } from "./dashboard-data";
import {
  mapPostgresSale,
  parseDataSource,
  readSalesForSource,
  validateDatabaseUrl,
  type SalesDataSource,
} from "./sales-data-source";

type DatabaseSaleRow = Record<string, unknown>;

type SalesResponse = {
  source: SalesDataSource;
  sales: typeof DEMO_SALES;
};

type Readiness =
  | { ready: true; source: "demo"; database: "not_required" }
  | { ready: true; source: "postgres"; database: "connected" }
  | { ready: false; source?: "postgres"; database: "misconfigured" | "unavailable" };

const globalForPool = globalThis as typeof globalThis & {
  axonSalesPool?: Pool;
};

function getPool() {
  const connectionString = validateDatabaseUrl(process.env.DATABASE_URL);
  if (!globalForPool.axonSalesPool) {
    const pool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 3_000,
      idleTimeoutMillis: 30_000,
      query_timeout: 5_000,
    });
    pool.on("error", () => {
      console.error("Unexpected idle PostgreSQL client error; client discarded.");
    });
    globalForPool.axonSalesPool = pool;
  }

  return globalForPool.axonSalesPool;
}

export function getSalesDataSource(): SalesDataSource | undefined {
  try {
    return parseDataSource(process.env.DATA_SOURCE);
  } catch {
    return undefined;
  }
}

export async function getSalesData(): Promise<SalesResponse> {
  const source = parseDataSource(process.env.DATA_SOURCE);
  const sales = await readSalesForSource(source, {
    demo: () => DEMO_SALES,
    postgres: async () => {
      const result = await getPool().query<DatabaseSaleRow>(`
        SELECT
          id,
          customer,
          product,
          to_char(sale_date, 'YYYY-MM-DD') AS date,
          amount::text AS amount,
          status,
          channel
        FROM public.sales
        ORDER BY sale_date DESC, id ASC
      `);
      return result.rows.map(mapPostgresSale);
    },
  });

  return { source, sales };
}

export async function getReadiness(): Promise<Readiness> {
  let source: SalesDataSource;
  try {
    source = parseDataSource(process.env.DATA_SOURCE);
  } catch {
    return { ready: false, database: "misconfigured" };
  }

  if (source === "demo") {
    return { ready: true, source, database: "not_required" };
  }

  try {
    validateDatabaseUrl(process.env.DATABASE_URL);
  } catch {
    return { ready: false, source, database: "misconfigured" };
  }

  try {
    await getPool().query("SELECT 1 FROM public.sales LIMIT 0");
    return { ready: true, source, database: "connected" };
  } catch {
    return { ready: false, source, database: "unavailable" };
  }
}
