import { expect, test } from "@playwright/test";

test.describe("admin console smoke", () => {
  test("opens admin console and shows executive tab", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ecole2-e2e-auth", "1");
    });
    await page.goto("/admin");
    await expect(page.getByRole("navigation", { name: /navigation administration/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /vue d'ensemble/i })).toBeVisible();
  });
});