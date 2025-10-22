import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "./route";

const ORIGINAL_API_KEY = process.env.API_KEY;

const createRequest = (headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/v1/items", { headers });

const readJson = async (response: Response) => {
  const cloned = response.clone();
  return cloned.json() as Promise<unknown>;
};

describe("GET /api/v1/items", () => {
  beforeEach(() => {
    process.env.API_KEY = "test-api-key";
  });

  afterEach(() => {
    if (ORIGINAL_API_KEY === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = ORIGINAL_API_KEY;
    }
  });

  it("returns items when provided a valid API key", async () => {
    const response = await GET(createRequest({ "x-api-key": "test-api-key" }));

    expect(response.status).toBe(200);

    const payload = (await readJson(response)) as { items?: unknown };
    expect(Array.isArray(payload.items)).toBe(true);
    expect((payload.items as unknown[]).length).toBeGreaterThan(0);
  });

  it("rejects requests without an API key", async () => {
    const response = await GET(createRequest());

    expect(response.status).toBe(401);

    const payload = (await readJson(response)) as { error?: string };
    expect(payload.error).toMatch(/missing api key/i);
  });

  it("rejects requests with an invalid API key", async () => {
    const response = await GET(createRequest({ "x-api-key": "wrong-key" }));

    expect(response.status).toBe(401);

    const payload = (await readJson(response)) as { error?: string };
    expect(payload.error).toMatch(/invalid api key/i);
  });

  it("fails if the server is not configured with an API key", async () => {
    delete process.env.API_KEY;

    const response = await GET(createRequest({ "x-api-key": "test-api-key" }));

    expect(response.status).toBe(500);

    const payload = (await readJson(response)) as { error?: string };
    expect(payload.error).toMatch(/not configured/i);
  });
});
