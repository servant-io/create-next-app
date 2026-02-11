import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  default: {
    readFileSync: (filePath: string) => {
      if (filePath.includes("agents.json")) {
        return JSON.stringify([
          { name: "code-reviewer", description: "Reviews code changes" },
          { name: "doc-writer", description: "Writes documentation" },
          { name: "test-author", description: "Generates tests" },
        ]);
      }
      if (filePath.includes("skills.json")) {
        return JSON.stringify([
          { name: "lint-fix", description: "Auto-fixes lint errors" },
          { name: "refactor", description: "Refactors code" },
        ]);
      }
      if (filePath.includes("action.yml")) {
        return "name: docs-up-to-date\ndescription: Checks docs are current\ninputs:\n  token:\n    description: GitHub token\n    required: true\n";
      }
      return "{}";
    },
  },
}));

vi.mock("node:path", () => ({
  default: {
    join: (...segments: string[]) => segments.join("/"),
  },
}));

vi.mock("yaml", () => ({
  parse: (raw: string) => {
    if (raw.includes("docs-up-to-date")) {
      return {
        name: "docs-up-to-date",
        description: "Checks docs are current",
        inputs: {
          token: { description: "GitHub token", required: true },
        },
      };
    }
    return {};
  },
}));

vi.mock("@servant-io/cli/dist/lib.js", () => ({
  linkAgents: () => [],
}));

vi.mock("@servant-io/cli/dist/docs/index.js", () => ({
  updateClaudeMd: () => [
    {
      phase: "claude-md",
      ok: true,
      message: "[claude-md] would update (1234/8192 bytes)",
    },
  ],
}));

import { renderToStaticMarkup } from "react-dom/server";
import ServantPxtPage from "./page";

describe("servant-pxt demo page", () => {
  it("renders the page title", () => {
    const element = ServantPxtPage();
    const html = renderToStaticMarkup(element);
    expect(html).toContain("servant-pxt Packages Demo");
  });

  it("renders the @servant-io/agents section with agent names", () => {
    const element = ServantPxtPage();
    const html = renderToStaticMarkup(element);
    expect(html).toContain("@servant-io/agents");
    expect(html).toContain("code-reviewer");
    expect(html).toContain("doc-writer");
    expect(html).toContain("test-author");
    expect(html).toContain("3 agents loaded");
  });

  it("renders the @servant-io/cli section", () => {
    const element = ServantPxtPage();
    const html = renderToStaticMarkup(element);
    expect(html).toContain("@servant-io/cli");
    expect(html).toContain("linkAgents()");
    expect(html).toContain(
      "Agent, Skill, LinkResult, InitResult, DocsUpdatePhaseResult",
    );
  });

  it("renders the @servant-io/skills section with skill names", () => {
    const element = ServantPxtPage();
    const html = renderToStaticMarkup(element);
    expect(html).toContain("@servant-io/skills");
    expect(html).toContain("lint-fix");
    expect(html).toContain("refactor");
    expect(html).toContain("2 skills loaded");
  });

  it("renders the @servant-io/cli updateClaudeMd section", () => {
    const element = ServantPxtPage();
    const html = renderToStaticMarkup(element);
    expect(html).toContain("updateClaudeMd()");
    expect(html).toContain("1 result(s) (dry-run)");
    expect(html).toContain("[claude-md]");
  });

  it("renders the @servant-io/actions section with action details", () => {
    const element = ServantPxtPage();
    const html = renderToStaticMarkup(element);
    expect(html).toContain("@servant-io/actions");
    expect(html).toContain("docs-up-to-date");
    expect(html).toContain("Checks docs are current");
    expect(html).toContain("token");
  });
});
