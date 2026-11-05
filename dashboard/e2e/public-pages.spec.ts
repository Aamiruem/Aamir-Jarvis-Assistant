import { expect, test } from "@playwright/test";

test("landing page introduces Azarvis and links to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("AI voice assistant");
  await expect(page.getByRole("heading", { name: "What you can do with Azarvis" })).toBeAttached();

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 }); // a busy machine can take a moment to switch pages
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("landing page is ready for search engines", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AI Voice Assistant/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /voice assistant/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https?:\/\//);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(jsonLd["@graph"].map((n: { "@type": string }) => n["@type"])).toContain("FAQPage");

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /dashboard");
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("<loc>");
});

test("signed-in pages are kept out of search results", async ({ request }) => {
  // The HTML a crawler receives (in a browser, signed-out visitors are sent on to /login).
  const html = await (await request.get("/dashboard")).text();
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/);
});

test("login form validates before calling the server", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
});

test("register form explains the password rules", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password").click();
  await expect(page.getByText("At least 12 characters")).toBeVisible();
});

test("theme toggle switches to dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByRole("button", { name: /Theme: system/ }).click(); // system -> light
  await page.getByRole("button", { name: /Theme: light/ }).click(); // light -> dark
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("unknown pages show the 404 page", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
