import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders primary hero content", async ({ page }) => {
    await expect(page.getByRole("img", { name: "Next.js logo" })).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "To get started, edit the page.tsx file.",
        level: 1,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Looking for a starting point or more instructions? Head over to",
      ),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Deploy Now" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Documentation" }),
    ).toBeVisible();
  });

  test("opens external links in new tabs", async ({ page, context }) => {
    const deployLink = page.getByRole("link", { name: "Deploy Now" });
    await expect(deployLink).toHaveAttribute(
      "href",
      expect.stringContaining("https://vercel.com/new"),
    );
    await expect(deployLink).toHaveAttribute("target", "_blank");

    const [deployPopup] = await Promise.all([
      context.waitForEvent("page"),
      deployLink.click(),
    ]);
    expect(deployPopup.url()).toContain("https://vercel.com/new");
    await deployPopup.close();

    const docsLink = page.getByRole("link", { name: "Documentation" });
    await expect(docsLink).toHaveAttribute(
      "href",
      expect.stringContaining("https://nextjs.org/docs"),
    );
    await expect(docsLink).toHaveAttribute("target", "_blank");

    const [docsPopup] = await Promise.all([
      context.waitForEvent("page"),
      docsLink.click(),
    ]);
    expect(docsPopup.url()).toContain("https://nextjs.org/docs");
    await docsPopup.close();
  });
});
