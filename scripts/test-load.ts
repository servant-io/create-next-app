import { readFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

type EnvLookup = Record<string, string>;

type LoadTestOptions = {
  totalRequests: number;
  concurrency: number;
  timeoutMs: number;
  path: string;
};

type RequestContext = {
  url: URL;
  headers: Record<string, string>;
  init: RequestInit;
  requestIndex: number;
  totalRequests: number;
};

type ValidationResult =
  | boolean
  | {
      success: boolean;
      message?: string;
    };

type LoadTestScenario = {
  id: string;
  label: string;
  description: string;
  path?: string;
  mutate?: (context: RequestContext) => void;
  validate?: (response: Response, body: string) => ValidationResult;
};

const REQUIRED_ENV_VARS = ["API_BASE_URL", "API_KEY"] as const;
const ENV_FILES = [".env.local", ".env"];

const DEFAULT_OPTIONS: LoadTestOptions = {
  totalRequests: 50,
  concurrency: 10,
  timeoutMs: 5_000,
  path: "/api/v1/items",
};

const SCENARIOS: readonly LoadTestScenario[] = [
  {
    id: "baseline",
    label: "Baseline catalogue request",
    description:
      "Fetches the default catalogue view with a rolling limit parameter.",
    mutate: ({ url, requestIndex }) => {
      // Shift the limit parameter a bit so we do not hammer the exact same URL.
      const limit = 10 + (requestIndex % 5) * 5;
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("nonce", `${Date.now()}-${requestIndex}`);
    },
  },
  {
    id: "sql-injection",
    label: "SQL injection probe",
    description:
      "Attempts to coerce the search parameter into an SQL injection style payload.",
    mutate: ({ url, requestIndex }) => {
      url.searchParams.set(
        "search",
        requestIndex % 2 === 0
          ? "1' OR '1'='1; DROP TABLE items; --"
          : "'; SHUTDOWN; --",
      );
    },
    validate: (response) => response.status < 500,
  },
  {
    id: "xss-query",
    label: "XSS payload",
    description:
      "Injects a query parameter that looks like a simple cross-site scripting attempt.",
    mutate: ({ url }) => {
      url.searchParams.set("search", "<script>alert('owned')</script>");
    },
    validate: (response) => response.status < 500,
  },
  {
    id: "path-traversal",
    label: "Path traversal query",
    description:
      "Uses a suspicious file parameter to emulate path traversal probing.",
    mutate: ({ url }) => {
      url.searchParams.set("file", "../../etc/passwd");
    },
    validate: (response) => response.status < 500,
  },
  {
    id: "header-override",
    label: "Header injection probe",
    description:
      "Sends custom headers that mimic attempts to override upstream metadata.",
    mutate: ({ headers }) => {
      headers["x-forwarded-for"] = "203.0.113.9";
      headers["x-original-host"] = "admin.internal";
      headers["x-user"] = "admin; DROP TABLE sessions;";
    },
    validate: (response) => response.status < 500,
  },
  {
    id: "long-query",
    label: "Very long query string",
    description:
      "Floods the search parameter with a very long string to test limits.",
    mutate: ({ url }) => {
      const repeated = "A".repeat(1_024);
      url.searchParams.set("search", repeated);
    },
    validate: (response) => response.status < 500,
  },
];

const describeFetchError = (error: unknown, url: URL) => {
  if (!(error instanceof Error)) {
    return `Request to ${url.toString()} failed with unknown error`;
  }

  if (error.name === "AbortError") {
    return `Request to ${url.toString()} timed out`;
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

const printUsage = () => {
  console.log(
    "Usage: pnpm test:load [--requests=<count>] [--concurrency=<count>] [--timeout=<ms>] [--path=<relative-path>]",
  );
  console.log("");
  console.log("Examples:");
  console.log("  pnpm test:load --requests=100 --concurrency=20");
  console.log(
    "  pnpm test:load --requests=200 --concurrency=25 --timeout=8000 --path=/api/v1/items",
  );
  console.log("");
  console.log(
    `Defaults: requests=${DEFAULT_OPTIONS.totalRequests}, concurrency=${DEFAULT_OPTIONS.concurrency}, timeout=${DEFAULT_OPTIONS.timeoutMs}ms, path=${DEFAULT_OPTIONS.path}`,
  );
};

const parsePositiveInteger = (
  value: string | undefined,
  flag: string,
  minimum: number,
) => {
  if (!value) {
    throw new Error(`Flag ${flag} requires a value.`);
  }

  if (!/^\d+$/u.test(value)) {
    throw new Error(
      `Flag ${flag} requires a positive integer, received: ${value}`,
    );
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < minimum) {
    throw new Error(
      `Flag ${flag} must be an integer greater than or equal to ${minimum}.`,
    );
  }

  return parsed;
};

const parseCliOptions = (argv: string[]): LoadTestOptions | null => {
  if (argv.some((arg) => arg === "--help" || arg === "-h")) {
    printUsage();
    return null;
  }

  const options: LoadTestOptions = { ...DEFAULT_OPTIONS };

  for (const arg of argv) {
    if (arg.startsWith("--") || arg.startsWith("-")) {
      if (arg === "--help" || arg === "-h") {
        continue;
      }

      const [flag, value] = arg.split("=", 2);

      switch (flag) {
        case "--requests":
        case "-r":
          options.totalRequests = parsePositiveInteger(value, flag, 1);
          break;
        case "--concurrency":
        case "-c":
          options.concurrency = parsePositiveInteger(value, flag, 1);
          break;
        case "--timeout":
        case "-t":
          options.timeoutMs = parsePositiveInteger(value, flag, 100);
          break;
        case "--path":
        case "-p":
          if (!value || !value.trim()) {
            throw new Error("Flag --path requires a non-empty value.");
          }
          options.path = value.startsWith("/") ? value : `/${value}`;
          break;
        default:
          throw new Error(`Unknown flag: ${flag}`);
      }
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (options.concurrency > options.totalRequests) {
    options.concurrency = options.totalRequests;
  }

  return options;
};

const createScenarioStats = () => {
  return SCENARIOS.reduce<
    Map<string, { label: string; successes: number; failures: number }>
  >((accumulator, scenario) => {
    accumulator.set(scenario.id, {
      label: scenario.label,
      successes: 0,
      failures: 0,
    });
    return accumulator;
  }, new Map());
};

const clipBodySample = (body: string | undefined) => {
  if (!body) {
    return undefined;
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return undefined;
  }

  const limit = 200;
  return trimmed.length > limit ? `${trimmed.slice(0, limit - 3)}...` : trimmed;
};

const executeLoadTest = async (
  options: LoadTestOptions,
  baseUrl: string,
  apiKey: string,
) => {
  const totalRequests = options.totalRequests;
  const scenarioStats = createScenarioStats();
  const durations: number[] = [];
  let successCount = 0;
  let failureCount = 0;
  let failuresLogged = 0;
  const maxFailuresToLog = 5;

  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;

      if (current >= totalRequests) {
        break;
      }

      const scenario = SCENARIOS[current % SCENARIOS.length];
      if (!scenario) {
        failureCount += 1;
        console.error(
          `[test:load] No scenario configured for request ${current + 1}.`,
        );
        continue;
      }

      const requestContext: RequestContext = {
        url: new URL(scenario.path ?? options.path, baseUrl),
        headers: {
          accept: "application/json",
          "cache-control": "no-cache",
          "x-api-key": apiKey,
        },
        init: {
          method: "GET",
        },
        requestIndex: current,
        totalRequests,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);
      requestContext.init.signal = controller.signal;

      try {
        scenario.mutate?.(requestContext);
        requestContext.init.headers = requestContext.headers;

        const start = performance.now();
        const response = await fetch(requestContext.url, requestContext.init);
        const duration = performance.now() - start;
        const rawBody = await response.text();
        durations.push(duration);

        const validation = scenario.validate
          ? scenario.validate(response, rawBody)
          : response.status >= 200 && response.status < 300;

        const validationResult =
          typeof validation === "boolean"
            ? { success: validation }
            : validation || { success: false };

        const stats = scenarioStats.get(scenario.id);

        if (!stats) {
          continue;
        }

        if (validationResult.success) {
          stats.successes += 1;
          successCount += 1;
        } else {
          stats.failures += 1;
          failureCount += 1;

          if (failuresLogged < maxFailuresToLog) {
            failuresLogged += 1;
            const message =
              validationResult.message && validationResult.message.trim()
                ? validationResult.message
                : `${response.status} ${response.statusText || ""}`.trim() ||
                  "Unexpected response";
            console.error(
              `[test:load] FAIL #${current + 1} (${scenario.label}) ${message} - ${requestContext.url.toString()}`,
            );
            const sample = clipBodySample(rawBody);
            if (sample) {
              console.error(`  Response: ${sample}`);
            }
          }
        }
      } catch (error) {
        failureCount += 1;
        const stats = scenarioStats.get(scenario.id);
        if (stats) {
          stats.failures += 1;
        }

        if (failuresLogged < maxFailuresToLog) {
          failuresLogged += 1;
          const message =
            error instanceof Error && error.name === "AbortError"
              ? `Timed out after ${options.timeoutMs}ms`
              : describeFetchError(error, requestContext.url);
          console.error(
            `[test:load] FAIL #${current + 1} (${scenario.label}) ${message}`,
          );
        }
      } finally {
        clearTimeout(timeoutId);
      }

      const completed = current + 1;
      const interval = Math.max(1, Math.floor(totalRequests / 10));
      if (completed % interval === 0 || completed === totalRequests) {
        console.log(
          `[test:load] Progress: ${completed}/${totalRequests} requests`,
        );
      }
    }
  };

  const workerCount = Math.min(options.concurrency, totalRequests);
  const workers: Promise<void>[] = [];

  for (let index = 0; index < workerCount; index += 1) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const sortedDurations = durations.slice().sort((a, b) => a - b);

  const percentile = (p: number): number => {
    if (sortedDurations.length === 0) {
      return 0;
    }
    const rank = (p / 100) * (sortedDurations.length - 1);
    const lowerIndex = Math.floor(rank);
    const upperIndex = Math.ceil(rank);
    const lower = sortedDurations[lowerIndex];
    const upper = sortedDurations[upperIndex];
    if (lower === undefined || upper === undefined) {
      return 0;
    }
    if (lowerIndex === upperIndex) {
      return lower;
    }
    const weight = rank - lowerIndex;
    return lower * (1 - weight) + upper * weight;
  };

  return {
    successCount,
    failureCount,
    durations,
    p50: percentile(50),
    p95: percentile(95),
    fastest: sortedDurations[0] ?? 0,
    slowest: sortedDurations[sortedDurations.length - 1] ?? 0,
    scenarioStats,
  };
};

const run = async () => {
  const options = parseCliOptions(process.argv.slice(2));

  if (!options) {
    return;
  }

  let env: Map<string, string>;

  try {
    env = await resolveRequiredEnv();
  } catch (error) {
    console.error("[test:load] Configuration error:");
    console.error(error instanceof Error ? `  ${error.message}` : error);
    process.exitCode = 1;
    return;
  }

  const baseUrl = env.get("API_BASE_URL") as string;
  const apiKey = env.get("API_KEY") as string;

  console.log(
    `[test:load] Starting load test -> ${options.totalRequests} requests, concurrency ${options.concurrency}, timeout ${options.timeoutMs}ms`,
  );
  console.log(
    `[test:load] Target: ${new URL(options.path, baseUrl).toString()}`,
  );

  const start = performance.now();

  const {
    successCount,
    failureCount,
    durations,
    p50,
    p95,
    fastest,
    slowest,
    scenarioStats,
  } = await executeLoadTest(options, baseUrl, apiKey);

  const elapsedMs = performance.now() - start;
  const total = successCount + failureCount;
  const avg =
    durations.length > 0
      ? durations.reduce((acc, value) => acc + value, 0) / durations.length
      : 0;

  console.log("");
  console.log("[test:load] Summary");
  console.log(
    `  Completed ${total} request${total === 1 ? "" : "s"} in ${elapsedMs.toFixed(0)}ms (${(
      (total / Math.max(elapsedMs, 1)) *
      1_000
    ).toFixed(2)} req/s)`,
  );
  console.log(`  Successes: ${successCount}`);
  console.log(`  Failures: ${failureCount}`);
  if (durations.length > 0) {
    console.log(
      `  Latency (ms): avg=${avg.toFixed(2)} p50=${p50.toFixed(
        2,
      )} p95=${p95.toFixed(2)} min=${fastest.toFixed(
        2,
      )} max=${slowest.toFixed(2)}`,
    );
  }

  console.log("");
  console.log("  Scenario results:");
  for (const scenario of SCENARIOS) {
    const stats = scenarioStats.get(scenario.id);
    if (!stats) {
      continue;
    }
    console.log(
      `    - ${scenario.label}: ${stats.successes} ok, ${stats.failures} fail`,
    );
  }

  if (failureCount > 0) {
    process.exitCode = 1;
  }
};

const main = async () => {
  try {
    await run();
  } catch (error) {
    console.error("[test:load] Unexpected error:");
    console.error(error instanceof Error ? `  ${error.message}` : error);
    process.exitCode = 1;
  }
};

void main();
