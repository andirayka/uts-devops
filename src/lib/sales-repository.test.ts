import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPools = vi.hoisted(
  () =>
    [] as Array<{
      emit: (event: string, ...args: unknown[]) => void;
      query: (...args: unknown[]) => Promise<{ rows: unknown[] }>;
    }>,
);

vi.mock("server-only", () => ({}));
vi.mock("pg", () => ({
  Pool: class {
    private readonly handlers = new Map<
      string,
      Array<(...args: unknown[]) => void>
    >();

    query = vi.fn(async () => ({ rows: [] }));

    constructor() {
      mockPools.push(this);
    }

    on(event: string, listener: (...args: unknown[]) => void) {
      const handlers = this.handlers.get(event) ?? [];
      handlers.push(listener);
      this.handlers.set(event, handlers);
      return this;
    }

    emit(event: string, ...args: unknown[]) {
      const handlers = this.handlers.get(event);
      if (!handlers?.length) {
        throw new Error(`Unhandled ${event} event`);
      }
      handlers.forEach((handler) => handler(...args));
    }
  },
}));

import { getSalesData } from "./sales-repository";

describe("PostgreSQL pool background errors", () => {
  beforeEach(() => {
    mockPools.length = 0;
    Reflect.deleteProperty(globalThis, "axonSalesPool");
    vi.stubEnv("DATA_SOURCE", "postgres");
    vi.stubEnv("DATABASE_URL", "postgresql://user:private-value@localhost/db");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    Reflect.deleteProperty(globalThis, "axonSalesPool");
  });

  it("handles idle-client errors with a fixed message and no secret details", async () => {
    await expect(getSalesData()).resolves.toEqual({ source: "postgres", sales: [] });
    expect(mockPools).toHaveLength(1);

    const error = new Error("connection string leaked: private-value");
    expect(() => mockPools[0].emit("error", error, { id: "client-secret" })).not.toThrow();

    expect(console.error).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledWith(
      "Unexpected idle PostgreSQL client error; client discarded.",
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "private-value",
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      "client-secret",
    );
  });
});
