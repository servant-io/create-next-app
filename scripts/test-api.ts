import { readFile } from "node:fs/promises";
import path from "node:path";

type Item = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  inStock: boolean;
};

type ItemsPayload = { items: Item[] };

type EnvLookup = Record<string, string>;

const REQUIRED_ENV_VARS = ["API_BASE_URL", "API_KEY"] as const;
const ENV_FILES = [".env.local", ".env"];

const describeFetchError = (error: unknown, url: URL) => {
  if (!(error instanceof Error)) {
    return `Request to ${url.toString()} failed with unknown error`;
  }

  const cause = (error as { cause?: unknown }).cause;

  if (
    cause &&
    typeof cause === "object" &&
    "code" in cause &&
    typeof (cause as { code: unknown }).code === "string"
  ) {
    const code = (cause as { code: string }).code;
    switch (code) {
      case "ECONNREFUSED":
        return `Unable to connect to ${url.toString()}. Is the dev server running?`;
      case "ENOTFOUND":
        return `Host for ${url.toString()} could not be resolved. Check API_BASE_URL.`;
      default:
        return `Network error ${code} while requesting ${url.toString()}.`;
    }
  }

  return `${error.message} (${url.toString()})`;
};

const parseEnvFile = (contents: string): EnvLookup => {
  return contents.split(/\r?\n/u).reduce<EnvLookup>((accumulator, rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      return accumulator;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      return accumulator;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    accumulator[key] = value;

    return accumulator;
  }, {});
};

let cachedEnv: EnvLookup | null = null;

const loadEnvFromFiles = async (): Promise<EnvLookup> => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const env: EnvLookup = {};

  for (const filename of ENV_FILES) {
    const filePath = path.resolve(process.cwd(), filename);

    try {
      const contents = await readFile(filePath, "utf8");
      Object.assign(env, parseEnvFile(contents));
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: unknown }).code === "ENOENT"
      ) {
        continue;
      }

      throw new Error(
        `Unable to read ${filename}: ${(error as Error).message}`,
      );
    }
  }

  cachedEnv = env;
  return env;
};

const resolveRequiredEnv = async () => {
  const resolved = new Map<string, string>();

  for (const key of REQUIRED_ENV_VARS) {
    const existing = process.env[key];
    if (existing && existing.trim()) {
      resolved.set(key, existing.trim());
      continue;
    }
  }

  if (resolved.size === REQUIRED_ENV_VARS.length) {
    return resolved;
  }

  const envFromFile = await loadEnvFromFiles();

  for (const key of REQUIRED_ENV_VARS) {
    if (!resolved.has(key) && envFromFile[key] && envFromFile[key].trim()) {
      resolved.set(key, envFromFile[key].trim());
    }
  }

  const missing = REQUIRED_ENV_VARS.filter((key) => !resolved.has(key));

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variable(s): ${missing.join(
        ", ",
      )}. Configure them via .env.local or the shell environment.`,
    );
  }

  return resolved;
};

const isItemsPayload = (value: unknown): value is ItemsPayload => {
  if (!value || typeof value !== "object" || !("items" in value)) {
    return false;
  }

  const { items } = value as { items?: unknown };

  if (!Array.isArray(items) || items.length === 0) {
    return false;
  }

  return items.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const record = item as Partial<Item>;

    return (
      typeof record.id === "string" &&
      typeof record.name === "string" &&
      typeof record.description === "string" &&
      typeof record.priceCents === "number" &&
      typeof record.inStock === "boolean"
    );
  });
};

const readJson = (text: string): unknown => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

const run = async () => {
  let env: Map<string, string>;

  try {
    env = await resolveRequiredEnv();
  } catch (error) {
    console.error("[test:api] Configuration error:");
    console.error(error instanceof Error ? `  ${error.message}` : error);
    process.exitCode = 1;
    return;
  }

  const baseUrl = env.get("API_BASE_URL") as string;
  const apiKey = env.get("API_KEY") as string;

  const endpoint = new URL("/api/v1/items", baseUrl);
  console.log(`[test:api] GET ${endpoint.toString()}`);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      headers: {
        accept: "application/json",
        "x-api-key": apiKey,
      },
    });
  } catch (error) {
    console.error("[test:api] Request failed:");
    console.error(`  ${describeFetchError(error, endpoint)}`);
    process.exitCode = 1;
    return;
  }

  const rawBody = await response.text();
  const data = readJson(rawBody);

  if (!response.ok) {
    const errorMessage =
      data &&
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : rawBody || `HTTP ${response.status}`;

    console.error(
      `[test:api] FAIL ${response.status} ${
        response.statusText || ""
      } - ${errorMessage}`,
    );
    process.exitCode = 1;
    return;
  }

  if (!isItemsPayload(data)) {
    console.error("[test:api] Response payload did not match expected schema.");
    console.error("  Received:", rawBody || "<empty>");
    process.exitCode = 1;
    return;
  }

  const { items } = data;

  console.log(
    `[test:api] PASS Received ${items.length} item${
      items.length === 1 ? "" : "s"
    }.`,
  );

  for (const item of items) {
    console.log(
      `  - ${item.name} (${item.id}) $${(item.priceCents / 100).toFixed(2)} [${
        item.inStock ? "in stock" : "out of stock"
      }]`,
    );
  }
};

const main = async () => {
  try {
    await run();
  } catch (error) {
    console.error("[test:api] Unexpected error:");
    console.error(error instanceof Error ? `  ${error.message}` : error);
    process.exitCode = 1;
  }
};

void main();
