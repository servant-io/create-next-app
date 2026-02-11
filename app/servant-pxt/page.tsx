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

// Render on-demand — reads from node_modules at runtime
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

function loadAction(): ActionManifest {
  // GitHub Action consumed as npm package data — parse the composite action YAML
  const raw = fs.readFileSync(
    pkgPath("@servant-io", "actions", "docs-up-to-date", "action.yml"),
    "utf-8",
  );
  return parseYaml(raw) as ActionManifest;
}

export default function ServantPxtPage() {
  // @servant-io/agents — data-only JSON manifest
  const agents = loadAgents();

  // @servant-io/skills — data-only JSON manifest
  const skills = loadSkills();

  // @servant-io/actions — GitHub Action YAML (consumed as npm package data)
  const action = loadAction();

  // @servant-io/cli — prove linkAgents is callable (empty manifest → empty array)
  const linkResult: LinkResult[] = linkAgents("", "", []);

  // Type annotations proving CLI types are importable
  const _agentType: Agent | null = null;
  const _skillType: Skill | null = null;
  const _initType: InitResult | null = null;
  void _agentType;
  void _skillType;
  void _initType;

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
      <div className="mx-auto max-w-3xl space-y-12">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
          servant-pxt Packages Demo
        </h1>

        {/* @servant-io/agents */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
            @servant-io/agents{" "}
            <span className="text-sm font-normal text-zinc-500">v0.4.0</span>
          </h2>
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            {agents.length} agents loaded from agents.json
          </p>
          <ul className="space-y-2">
            {agents.map((agent) => (
              <li
                key={agent.name}
                className="rounded border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <span className="font-medium text-black dark:text-zinc-50">
                  {agent.name}
                </span>
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {agent.description}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* @servant-io/cli */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
            @servant-io/cli{" "}
            <span className="text-sm font-normal text-zinc-500">v0.4.0</span>
          </h2>
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            linkAgents() returned {linkResult.length} results (empty manifest
            dry-run)
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Types imported: Agent, Skill, LinkResult, InitResult
          </p>
        </section>

        {/* @servant-io/skills */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
            @servant-io/skills{" "}
            <span className="text-sm font-normal text-zinc-500">v0.4.0</span>
          </h2>
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            {skills.length} skills loaded from skills.json
          </p>
          <ul className="space-y-2">
            {skills.map((skill) => (
              <li
                key={skill.name}
                className="rounded border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <span className="font-medium text-black dark:text-zinc-50">
                  {skill.name}
                </span>
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {skill.description}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* @servant-io/actions */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
            @servant-io/actions{" "}
            <span className="text-sm font-normal text-zinc-500">v0.4.0</span>
          </h2>
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            GitHub Action parsed from action.yml
          </p>
          <div className="rounded border border-zinc-200 p-4 dark:border-zinc-700">
            <p>
              <span className="font-medium text-black dark:text-zinc-50">
                Name:
              </span>{" "}
              <span className="text-zinc-600 dark:text-zinc-400">
                {action.name}
              </span>
            </p>
            <p>
              <span className="font-medium text-black dark:text-zinc-50">
                Description:
              </span>{" "}
              <span className="text-zinc-600 dark:text-zinc-400">
                {action.description}
              </span>
            </p>
            {action.inputs && (
              <div className="mt-2">
                <span className="font-medium text-black dark:text-zinc-50">
                  Inputs:
                </span>
                <ul className="mt-1 ml-4 list-disc text-sm text-zinc-600 dark:text-zinc-400">
                  {Object.entries(action.inputs).map(([key, input]) => (
                    <li key={key}>
                      <span className="font-mono">{key}</span>
                      {input.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                      {" — "}
                      {input.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
