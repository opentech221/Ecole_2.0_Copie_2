import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin console smoke", () => {
  test.skip(!email || !password, "Définir E2E_ADMIN_EMAIL et E2E_ADMIN_PASSWORD pour activer ce smoke test.");

  test("opens admin console and shows executive tab", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email as string);
    await page.getByLabel(/mot de passe|password/i).fill(password as string);
    await page.getByRole("button", { name: /connexion|sign in/i }).click();
    await page.goto("/admin");
    await expect(page.getByText("Admin Console 2026")).toBeVisible();
    await expect(page.getByText("Vue exécutive")).toBeVisible();
  });
});