import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString?.trim()) {
  console.error("Set DATABASE_URL in .env.local before setting up PostgreSQL.");
  process.exit(1);
}

const schema = await readFile(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
const fixtures = JSON.parse(
  await readFile(fileURLToPath(new URL("./demo-sales.json", import.meta.url)), "utf8"),
);
const pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 });
pool.on("error", () => {
  console.error("Unexpected idle PostgreSQL setup client error; client discarded.");
});

try {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(schema);
    for (const sale of fixtures) {
      await client.query(
        `INSERT INTO public.sales (id, customer, product, sale_date, amount, status, channel)
         VALUES ($1, $2, $3, $4::date, $5::numeric, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           customer = EXCLUDED.customer,
           product = EXCLUDED.product,
           sale_date = EXCLUDED.sale_date,
           amount = EXCLUDED.amount,
           status = EXCLUDED.status,
           channel = EXCLUDED.channel`,
        [
          sale.id,
          sale.customer,
          sale.product,
          sale.date,
          sale.amount,
          sale.status,
          sale.channel,
        ],
      );
    }
    await client.query("COMMIT");
    console.log(`Schema ready; upserted ${fixtures.length} demo sales.`);
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("PostgreSQL setup failed; no connection details were printed.");
    process.exitCode = 1;
  } finally {
    client.release();
  }
} catch {
  console.error("Could not connect to PostgreSQL; no connection details were printed.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
