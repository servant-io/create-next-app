import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

type NextImageProps = ComponentProps<"img"> & { priority?: boolean };

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority: _priority, ...props }: NextImageProps) => (
    <img {...props} />
  ),
}));

import Home from "./page";

describe("Home page", () => {
  it("highlights the quick-start message", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("To get started, edit the page.tsx file.");
    expect(html).toContain(
      "Looking for a starting point or more instructions?",
    );
  });

  it("links to key resources with accessible CTAs", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toMatch(/href="https:\/\/vercel\.com\/new/);
    expect(html).toMatch(/href="https:\/\/nextjs\.org\/docs/);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
