import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  default: {
    readFileSync: (filePath: string) => {
      if (filePath.includes("agents.json")) {
        return JSON.stringify([
          {
            name: "executive-eod-update",
            description: "Generate executive summary emails",
          },
          {
            name: "github-pr-reviewer",
            description: "Comprehensive code review of PRs",
          },
          {
            name: "loom-transcript-synthesizer",
            description: "Structured chapter markers",
          },
          { name: "package-release", description: "Release management" },
          { name: "prd-writer", description: "Create or update PRD documents" },
          {
            name: "sow-distiller",
            description: "Create sanitized SOW documents",
          },
          { name: "sprint-refinement", description: "Sprint-level refinement" },
          { name: "stacked-pr-rebase", description: "Rebase stacked PRs" },
          {
            name: "refresh-doc-orchestrator",
            description: "Refresh documentation",
          },
        ]);
      }
      if (filePath.includes("product-os") && filePath.includes("skills.json")) {
        return JSON.stringify([
          {
            name: "discovery",
            description: "Guide users through creating Discovery documents",
          },
          { name: "estimate", description: "Build staffing-driven estimates" },
          {
            name: "north-star",
            description: "Generate North Star vision documents",
          },
          { name: "prd", description: "Create Product Requirements Documents" },
          { name: "sow", description: "Generate Statements of Work" },
          {
            name: "validate",
            description: "Check if a phase meets readiness criteria",
          },
        ]);
      }
      if (filePath.includes("skills.json")) {
        return JSON.stringify([
          { name: "brainstorming", description: "Brainstorming sessions" },
          { name: "code-review", description: "Code review" },
          { name: "doc-refresh", description: "Documentation refresh" },
          { name: "loom-chapters", description: "Loom chapter markers" },
          { name: "prd-authoring", description: "PRD authoring" },
          { name: "release-management", description: "Release workflow" },
          { name: "servant-_init", description: "Internal init" },
          {
            name: "servant-_quality-gate",
            description: "Internal quality checks",
          },
          { name: "servant-bump", description: "Version bumps" },
          { name: "servant-commit", description: "Smart commit" },
          { name: "servant-config", description: "Servant Config" },
          { name: "servant-eod", description: "EOD summary" },
          { name: "servant-execute", description: "Execute plans" },
          { name: "servant-plan", description: "Planning workflow" },
          { name: "servant-refine", description: "Refinement workflow" },
          { name: "servant-strategy", description: "Strategy workflow" },
          { name: "servant-verification", description: "Quality verification" },
          { name: "sow-sanitizer", description: "SOW sanitization" },
          { name: "stacked-pr", description: "Stacked PRs" },
        ]);
      }
      if (filePath.includes("action.yml")) {
        return "name: docs-up-to-date\ndescription: Checks docs are current\ninputs:\n  token:\n    description: GitHub token\n    required: true\n  paths:\n    description: Paths to check\n  base-branch:\n    description: Base branch for comparison\n  fail-on-outdated:\n    description: Fail if docs are outdated\n";
      }
      return "{}";
    },
  },
  readFileSync: (filePath: string) => {
    // Also export as named for pre-commit-hooks usage
    return Buffer.from("x".repeat(5870));
  },
}));

vi.mock("node:path", () => ({
  default: {
    join: (...segments: string[]) => segments.join("/"),
  },
  join: (...segments: string[]) => segments.join("/"),
}));

vi.mock("yaml", () => ({
  parse: (raw: string) => {
    if (raw.includes("docs-up-to-date")) {
      return {
        name: "docs-up-to-date",
        description: "Checks docs are current",
        inputs: {
          token: { description: "GitHub token", required: true },
          paths: { description: "Paths to check" },
          "base-branch": { description: "Base branch for comparison" },
          "fail-on-outdated": { description: "Fail if docs are outdated" },
        },
      };
    }
    return {};
  },
}));

vi.mock("@servant-io/cli/dist/lib.js", () => ({
  linkAgents: () => [],
}));

vi.mock("@servant-io/pre-commit-hooks", () => ({
  verifyClaudeMd: () => ({
    ok: true,
    bytes: 5870,
    limit: 8192,
    file: "CLAUDE.md",
  }),
}));

import { renderToStaticMarkup } from "react-dom/server";
import ServantPxtPage from "./page";

describe("servant-pxt demo page", () => {
  it("renders hero with platform title and v0.7.5 badge", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    expect(html).toContain("servant-pxt");
    expect(html).toContain("The AI Engineering Platform");
    expect(html).toContain("v0.7.5");
  });

  it("renders stats summary row", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    expect(html).toContain("6");
    expect(html).toContain("Packages");
    expect(html).toContain("9");
    expect(html).toContain("Agents");
    expect(html).toContain("Commands");
    expect(html).toContain("Phases");
    expect(html).toContain("Hooks");
  });

  it("renders Product OS section with 6 phase names", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    expect(html).toContain("Product OS");
    expect(html).toContain("discovery");
    expect(html).toContain("north star");
    expect(html).toContain("prd");
    expect(html).toContain("estimate");
    expect(html).toContain("sow");
    expect(html).toContain("validate");
  });

  it("renders agents section with agent names", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    expect(html).toContain("Agent Fleet");
    expect(html).toContain("executive-eod-update");
    expect(html).toContain("github-pr-reviewer");
    expect(html).toContain("prd-writer");
    expect(html).toContain("9 agents loaded");
  });

  it("renders skills section with skill count", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    expect(html).toContain("Skill Library");
    expect(html).toContain("19 skills loaded");
    expect(html).toContain("brainstorming");
    expect(html).toContain("servant-_init");
  });

  it("renders internal badge for servant-_ prefixed skills", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    expect(html).toContain("internal");
  });

  it("renders CLI section with command categories", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    expect(html).toContain("CLI Toolchain");
    expect(html).toContain("# Setup");
    expect(html).toContain("# Workflow");
    expect(html).toContain("# Release");
    expect(html).toContain("servant postinstall");
    expect(html).toContain("servant plan");
    expect(html).toContain("servant bump");
  });

  it("renders actions section with docs-up-to-date details", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    expect(html).toContain("CI/CD Guard Rails");
    expect(html).toContain("docs-up-to-date");
    expect(html).toContain("Checks docs are current");
    expect(html).toContain("token");
  });

  it("renders pre-commit-hooks section with live CLAUDE.md result", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    expect(html).toContain("Pre-commit Hooks");
    expect(html).toContain("verify-claude-md");
    expect(html).toContain("verify-versions");
    expect(html).toContain("5,870");
    expect(html).toContain("8,192");
    expect(html).toContain("pass");
    expect(html).toContain("CLAUDE.md");
  });

  it("shows v0.7.5 version label on all package sections", () => {
    const html = renderToStaticMarkup(ServantPxtPage());
    // Hero badge + 6 section badges = at least 7 occurrences
    const matches = html.match(/v0\.7\.5/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(7);
  });
});
