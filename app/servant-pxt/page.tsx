import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
  linkAgents,
  type Agent,
  type Skill,
  type LinkResult,
  type InitResult,
} from "@servant-io/cli/dist/lib.js";
import {
  verifyClaudeMd,
  type VerifyClaudeMdResult,
  type VerifyVersionsOptions,
  type VerifyVersionsResult,
} from "@servant-io/pre-commit-hooks";

export const dynamic = "force-dynamic";

interface AgentEntry {
  name: string;
  description: string;
}

interface SkillEntry {
  name: string;
  description: string;
}

interface ActionInput {
  description: string;
  required?: boolean;
  default?: string;
}

interface ActionManifest {
  name: string;
  description: string;
  inputs?: Record<string, ActionInput>;
}

interface CliCommand {
  name: string;
  description: string;
  category: "Setup" | "Workflow" | "Release";
}

const CLI_COMMANDS: CliCommand[] = [
  {
    name: "servant init",
    description: "Initialize a new engagement workspace",
    category: "Setup",
  },
  {
    name: "servant postinstall",
    description: "Link agents, skills, and product-os in one step",
    category: "Setup",
  },
  {
    name: "servant link-agents",
    description: "Symlink agent .md files into .claude/agents/servant/",
    category: "Setup",
  },
  {
    name: "servant link-skills",
    description: "Symlink skill directories into .claude/skills/servant/",
    category: "Setup",
  },
  {
    name: "servant link-product-os",
    description: "Symlink Product OS skills into project",
    category: "Setup",
  },
  {
    name: "servant plan",
    description: "Generate an implementation plan from a ticket",
    category: "Workflow",
  },
  {
    name: "servant execute",
    description: "Execute a plan with incremental commits",
    category: "Workflow",
  },
  {
    name: "servant verify",
    description: "Run quality checks against implementation",
    category: "Workflow",
  },
  {
    name: "servant commit",
    description: "AI-assisted commit with doc refresh",
    category: "Workflow",
  },
  {
    name: "servant eod",
    description: "Generate end-of-day executive summary",
    category: "Workflow",
  },
  {
    name: "servant bump",
    description: "Bump versions across all workspace packages",
    category: "Release",
  },
  {
    name: "servant release",
    description: "Run release workflow with pre-checks",
    category: "Release",
  },
  {
    name: "servant doc-refresh",
    description: "Refresh documentation across all domains",
    category: "Release",
  },
];

function pkgPath(...segments: string[]): string {
  return path.join(process.cwd(), "node_modules", ...segments);
}

function loadAgents(): AgentEntry[] {
  const raw = fs.readFileSync(
    pkgPath("@servant-io", "agents", "src", "agents.json"),
    "utf-8",
  );
  return JSON.parse(raw) as AgentEntry[];
}

function loadSkills(): SkillEntry[] {
  const raw = fs.readFileSync(
    pkgPath("@servant-io", "skills", "src", "skills.json"),
    "utf-8",
  );
  return JSON.parse(raw) as SkillEntry[];
}

function loadProductOsSkills(): SkillEntry[] {
  const raw = fs.readFileSync(
    pkgPath("@servant-io", "product-os", "src", "skills.json"),
    "utf-8",
  );
  return JSON.parse(raw) as SkillEntry[];
}

function loadAction(): ActionManifest {
  const raw = fs.readFileSync(
    pkgPath("@servant-io", "actions", "docs-up-to-date", "action.yml"),
    "utf-8",
  );
  return parseYaml(raw) as ActionManifest;
}

export default function ServantPxtPage() {
  const agents = loadAgents();
  const skills = loadSkills();
  const productOsSkills = loadProductOsSkills();
  const action = loadAction();

  // CLI — prove linkAgents is callable (empty manifest → empty array)
  const linkResult: LinkResult[] = linkAgents("", "", []);

  // Type annotations proving CLI types are importable
  const _agentType: Agent | null = null;
  const _skillType: Skill | null = null;
  const _initType: InitResult | null = null;
  void _agentType;
  void _skillType;
  void _initType;

  // Type annotations proving pre-commit-hooks types are importable
  const _verifyVersionsOpts: VerifyVersionsOptions | null = null;
  const _verifyVersionsResult: VerifyVersionsResult | null = null;
  void _verifyVersionsOpts;
  void _verifyVersionsResult;

  // Pre-commit hooks — live CLAUDE.md verification
  const claudeMdResult: VerifyClaudeMdResult = verifyClaudeMd({
    file: path.join(process.cwd(), "CLAUDE.md"),
  });

  const commandsByCategory = CLI_COMMANDS.reduce<Record<string, CliCommand[]>>(
    (acc, cmd) => {
      const list = acc[cmd.category] ?? (acc[cmd.category] = []);
      list.push(cmd);
      return acc;
    },
    {},
  );

  const now = new Date().toISOString();

  return (
    <div
      className="servant-brand min-h-screen"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Section 0: Hero */}
      <section
        style={{ backgroundColor: "var(--servant-deep-maroon)" }}
        className="px-8 py-20 text-white"
      >
        <div className="mx-auto max-w-5xl">
          <h1
            className="mb-4 text-5xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            servant-pxt
          </h1>
          <p className="mb-6 text-xl opacity-90">
            The AI Engineering Platform for product teams.
          </p>
          <span
            className="inline-block rounded-full border px-4 py-1 text-sm font-medium"
            style={{
              borderColor: "var(--servant-red)",
              color: "var(--servant-red)",
            }}
          >
            v0.7.5
          </span>
          <div className="mt-10 flex flex-wrap gap-8 text-sm opacity-80">
            <div>
              <span className="text-2xl font-semibold text-white">6</span>{" "}
              <span>Packages</span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white">
                {agents.length}
              </span>{" "}
              <span>Agents</span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white">
                {skills.length}
              </span>{" "}
              <span>Skills</span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white">
                {CLI_COMMANDS.length}
              </span>{" "}
              <span>Commands</span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white">
                {productOsSkills.length}
              </span>{" "}
              <span>Phases</span>
            </div>
            <div>
              <span className="text-2xl font-semibold text-white">2</span>{" "}
              <span>Hooks</span>
            </div>
          </div>
        </div>
      </section>

      <div
        style={{
          backgroundColor: "var(--servant-paper-white)",
          color: "var(--servant-ink)",
        }}
      >
        {/* Section 1: Product OS */}
        <section className="px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-3">
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Product OS
              </h2>
              <VersionBadge />
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: "var(--servant-red)" }}
              >
                NEW
              </span>
            </div>
            <p className="mb-8" style={{ color: "var(--servant-soft-ink)" }}>
              @servant-io/product-os — {productOsSkills.length} phase skills
              powering the engagement lifecycle.
            </p>
            <div className="relative flex items-start justify-between gap-4">
              {/* Connecting line */}
              <div
                className="absolute top-5 right-8 left-8 h-0.5"
                style={{ backgroundColor: "#E5E2DE" }}
              />
              {productOsSkills.map((phase, i) => (
                <div
                  key={phase.name}
                  className="relative z-10 flex flex-1 flex-col items-center text-center"
                >
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--servant-deep-maroon)" }}
                  >
                    {i + 1}
                  </div>
                  <span className="mb-1 text-sm font-medium capitalize">
                    {phase.name.replace(/-/g, " ")}
                  </span>
                  <span
                    className="text-xs leading-tight"
                    style={{ color: "var(--servant-soft-ink)" }}
                  >
                    {phase.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Agent Fleet */}
        <section className="px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-3">
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Agent Fleet
              </h2>
              <VersionBadge />
            </div>
            <p className="mb-8" style={{ color: "var(--servant-soft-ink)" }}>
              @servant-io/agents — {agents.length} agents loaded from
              agents.json
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-lg bg-white p-4 shadow-sm"
                  style={{ border: "1px solid #E5E2DE" }}
                >
                  <span className="text-sm font-medium">{agent.name}</span>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--servant-soft-ink)" }}
                  >
                    {agent.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Skill Library */}
        <section className="px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-3">
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Skill Library
              </h2>
              <VersionBadge />
            </div>
            <p className="mb-8" style={{ color: "var(--servant-soft-ink)" }}>
              @servant-io/skills — {skills.length} skills loaded from
              skills.json
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {skills.map((skill) => (
                <div
                  key={skill.name}
                  className="rounded-lg bg-white px-3 py-2 shadow-sm"
                  style={{ border: "1px solid #E5E2DE" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{skill.name}</span>
                    {skill.name.startsWith("servant-_") && (
                      <span
                        className="rounded px-1.5 py-0.5 text-xs"
                        style={{
                          backgroundColor: "#F0EDE8",
                          color: "var(--servant-soft-ink)",
                        }}
                      >
                        internal
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-1 truncate text-xs"
                    style={{ color: "var(--servant-soft-ink)" }}
                  >
                    {skill.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: CLI Toolchain */}
        <section className="px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-3">
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                CLI Toolchain
              </h2>
              <VersionBadge />
            </div>
            <p className="mb-8" style={{ color: "var(--servant-soft-ink)" }}>
              @servant-io/cli — {CLI_COMMANDS.length} commands. One binary, full
              lifecycle coverage.
            </p>
            <div
              className="rounded-lg p-6 font-mono text-sm"
              style={{
                backgroundColor: "var(--servant-deep-maroon)",
                color: "#E5E2DE",
              }}
            >
              {(["Setup", "Workflow", "Release"] as const).map((category) => (
                <div key={category} className="mb-6 last:mb-0">
                  <div
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--servant-red)" }}
                  >
                    # {category}
                  </div>
                  {commandsByCategory[category]?.map((cmd) => (
                    <div key={cmd.name} className="py-0.5">
                      <span className="text-white">$ {cmd.name}</span>
                      <span className="ml-4 opacity-50">
                        # {cmd.description}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div
              className="mt-6 space-y-2 text-sm"
              style={{ color: "var(--servant-soft-ink)" }}
            >
              <p>
                linkAgents() dry-run returned {linkResult.length} results (empty
                manifest)
              </p>
              <p>Types imported: Agent, Skill, LinkResult, InitResult</p>
            </div>
          </div>
        </section>

        {/* Section 5: CI/CD Guard Rails */}
        <section className="px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-3">
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                CI/CD Guard Rails
              </h2>
              <VersionBadge />
            </div>
            <p className="mb-8" style={{ color: "var(--servant-soft-ink)" }}>
              @servant-io/actions — GitHub Actions for automated quality
              enforcement.
            </p>
            <div
              className="rounded-lg bg-white p-6 shadow-sm"
              style={{ border: "1px solid #E5E2DE" }}
            >
              <h3 className="mb-2 text-lg font-medium">{action.name}</h3>
              <p
                className="mb-4 text-sm"
                style={{ color: "var(--servant-soft-ink)" }}
              >
                {action.description}
              </p>
              {action.inputs && (
                <div>
                  <span className="text-sm font-medium">Inputs:</span>
                  <ul className="mt-2 space-y-1">
                    {Object.entries(action.inputs).map(([key, input]) => (
                      <li key={key} className="flex items-start gap-2 text-sm">
                        <code
                          className="rounded px-1.5 py-0.5 text-xs"
                          style={{ backgroundColor: "#F0EDE8" }}
                        >
                          {key}
                        </code>
                        {input.required && (
                          <span style={{ color: "var(--servant-red)" }}>*</span>
                        )}
                        <span style={{ color: "var(--servant-soft-ink)" }}>
                          {input.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 6: Pre-commit Hooks */}
        <section className="px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-3">
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Pre-commit Hooks
              </h2>
              <VersionBadge />
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: "var(--servant-red)" }}
              >
                NEW
              </span>
            </div>
            <p className="mb-8" style={{ color: "var(--servant-soft-ink)" }}>
              @servant-io/pre-commit-hooks — Validation hooks baked into the
              workflow.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div
                className="rounded-lg bg-white p-6 shadow-sm"
                style={{ border: "1px solid #E5E2DE" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg font-medium">verify-claude-md</span>
                  {claudeMdResult.ok ? (
                    <span
                      className="text-green-600"
                      title="CLAUDE.md is within size limit"
                    >
                      &#10003;
                    </span>
                  ) : (
                    <span
                      className="text-red-600"
                      title="CLAUDE.md exceeds size limit"
                    >
                      &#10007;
                    </span>
                  )}
                </div>
                <p
                  className="mb-3 text-sm"
                  style={{ color: "var(--servant-soft-ink)" }}
                >
                  Ensures CLAUDE.md stays under the 8KB limit for optimal AI
                  context loading.
                </p>
                <div
                  className="text-xs"
                  style={{ color: "var(--servant-soft-ink)" }}
                >
                  <p>File: {claudeMdResult.file}</p>
                  <p>
                    Size: {claudeMdResult.bytes.toLocaleString()} /{" "}
                    {claudeMdResult.limit.toLocaleString()} bytes
                  </p>
                  <p>Status: {claudeMdResult.ok ? "pass" : "fail"}</p>
                </div>
              </div>
              <div
                className="rounded-lg bg-white p-6 shadow-sm"
                style={{ border: "1px solid #E5E2DE" }}
              >
                <h3 className="mb-3 text-lg font-medium">verify-versions</h3>
                <p
                  className="mb-3 text-sm"
                  style={{ color: "var(--servant-soft-ink)" }}
                >
                  Validates all packages in a monorepo share the same version.
                  Catches drift before it ships.
                </p>
                <div
                  className="text-xs"
                  style={{ color: "var(--servant-soft-ink)" }}
                >
                  <p>Types: VerifyVersionsOptions, VerifyVersionsResult</p>
                  <p>
                    Scans packages/ for version mismatches against an expected
                    version string.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer>
        <div
          className="h-1"
          style={{ backgroundColor: "var(--servant-red)" }}
        />
        <div
          className="px-8 py-8 text-center text-sm"
          style={{
            backgroundColor: "var(--servant-paper-white)",
            color: "var(--servant-soft-ink)",
          }}
        >
          Built with servant-pxt v0.7.5 · Next.js 16 · Server-rendered at {now}
        </div>
      </footer>
    </div>
  );
}

function VersionBadge() {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: "var(--servant-red)", color: "var(--servant-red)" }}
    >
      v0.7.5
    </span>
  );
}
