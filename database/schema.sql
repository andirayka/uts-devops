CREATE TABLE IF NOT EXISTS public.sales (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  product TEXT NOT NULL,
  sale_date DATE NOT NULL,
  amount NUMERIC(15, 0) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('completed', 'processing', 'cancelled')),
  channel TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_sale_date_id_idx
  ON public.sales (sale_date DESC, id ASC);

CREATE INDEX IF NOT EXISTS sales_status_idx
  ON public.sales (status);
