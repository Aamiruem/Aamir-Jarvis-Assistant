import { expect, test } from "@playwright/test";

test("landing page introduces Jarvis and links to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Everything Jarvis knows");
  await expect(page.getByRole("heading", { name: "What you can do" })).toBeVisible();

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
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
