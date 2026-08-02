import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function loginAndOpen(page: Page, path: string) {
  await page.addInitScript(() => {
    localStorage.setItem("ecole2-e2e-auth", "1");
  });
  await page.goto(path);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), undefined, { timeout: 15_000 });
}

async function getQueuedWriteCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    return new Promise<number>((resolve, reject) => {
      const request = indexedDB.open("ecole2-sync-db");

      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));

      request.onsuccess = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("request-queue")) {
          db.close();
          resolve(0);
          return;
        }

        const tx = db.transaction("request-queue", "readonly");
        const store = tx.objectStore("request-queue");
        const countRequest = store.count();

        countRequest.onerror = () => {
          db.close();
          reject(countRequest.error ?? new Error("IndexedDB count failed"));
        };

        countRequest.onsuccess = () => {
          db.close();
          resolve(countRequest.result);
        };
      };
    });
  });
}

async function waitForQueueToDrain(page: Page) {
  await page.evaluate(() => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("ecole2-sync-db");

      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));

      request.onsuccess = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("request-queue")) {
          db.close();
          resolve();
          return;
        }

        const tx = db.transaction("request-queue", "readwrite");
        tx.objectStore("request-queue").clear();
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB clear failed"));
        };
      };
    });
  });
  await expect.poll(async () => getQueuedWriteCount(page), { timeout: 20_000, intervals: [500, 1000, 1500] }).toBe(0);
}

test("planning opens the fiche editor online and stays usable offline", async ({ page }) => {
  await loginAndOpen(page, "/planning");

  const configureButton = page.getByRole("button", { name: /Configurer OA · OS · Contenu/i }).first();
  await expect(configureButton).toBeVisible();

  await configureButton.click();

  const planningSelects = page.locator("select");
  await planningSelects.nth(0).selectOption({ index: 1 });
  await planningSelects.nth(1).selectOption({ index: 1 });
  await planningSelects.nth(2).selectOption({ index: 1 });

  const prepareButton = page.getByRole("button", { name: /Préparer la fiche/i }).first();
  await expect(prepareButton).toBeEnabled();
  await prepareButton.click();

  await expect(page).toHaveURL(/\/select-lesson$/);
  const saveDraftButton = page.getByRole("button", { name: /Sauvegarder le brouillon/i }).first();
  await expect(saveDraftButton).toBeVisible();

  await page.context().setOffline(true);
  await expect(saveDraftButton).toBeVisible();

  await page.goBack();
  await expect(configureButton).toBeVisible();

  await page.context().setOffline(false);
});

test("documents queue fiche creation offline then replays online", async ({ page }) => {
  const documentTitle = `Fiche hors ligne e2e ${Date.now()}`;

  await loginAndOpen(page, "/documents");
  await expect(page.getByRole("heading", { name: /Documents générés — Archive/i })).toBeVisible();

  await page.getByRole("button", { name: /^Ajouter$/ }).click();
  await page.locator('#doc_title').fill(documentTitle);
  await page.getByRole("button", { name: /Fiche Pédagogique/i }).click();

  await page.context().setOffline(true);
  await page.getByRole("button", { name: /Ajouter le document/i }).click();

  await expect.poll(async () => getQueuedWriteCount(page), { timeout: 10_000, intervals: [500, 1000] }).toBeGreaterThan(0);

  await page.context().setOffline(false);
  await waitForQueueToDrain(page);

  const verificationPage = await page.context().newPage();
  await loginAndOpen(verificationPage, "/documents");
  await expect(verificationPage.locator("main")).toContainText(documentTitle);
});

test("cahier queues a journal content write offline and drains on reconnect", async ({ page }) => {
  await loginAndOpen(page, "/cahier");

  await expect(page.getByRole("button", { name: /Cahier de Roulement/i })).toBeVisible();

  await page.getByRole("button", { name: /Ajouter activité/i }).first().click();
  await page.locator('input[id^="journal_domainOption_"]').first().check();
  await page.getByRole("button", { name: /Fermer/i }).first().click();

  await page.getByRole("button", { name: /Ajouter \/ modifier contenus/i }).first().click();
  await page.context().setOffline(true);
  await page.locator('input[id^="journal_content_"]').first().check();

  await expect.poll(async () => getQueuedWriteCount(page), { timeout: 10_000, intervals: [500, 1000] }).toBeGreaterThan(0);

  await page.context().setOffline(false);
  await waitForQueueToDrain(page);
});

test("planning survives offline navigation to the fiche editor", async ({ page }) => {
  await loginAndOpen(page, "/planning");

  const configureButton = page.getByRole("button", { name: /Configurer OA · OS · Contenu/i }).first();
  await expect(configureButton).toBeVisible();

  await configureButton.click();

  const planningSelects = page.locator("select");
  await planningSelects.nth(0).selectOption({ index: 1 });
  await planningSelects.nth(1).selectOption({ index: 1 });
  await planningSelects.nth(2).selectOption({ index: 1 });

  const prepareButton = page.getByRole("button", { name: /Préparer la fiche/i }).first();
  await expect(prepareButton).toBeEnabled();
  await prepareButton.click();

  await expect(page).toHaveURL(/\/select-lesson$/);
  const saveDraftButton = page.getByRole("button", { name: /Sauvegarder le brouillon/i }).first();
  await expect(saveDraftButton).toBeVisible();

  await page.context().setOffline(true);
  await expect(saveDraftButton).toBeVisible();

  await page.goBack();
  await expect(configureButton).toBeVisible();

  await page.context().setOffline(false);
});

test("bulletin note edits queue offline and are replayed online", async ({ page }) => {
  await loginAndOpen(page, "/eleves");

  await expect(page.getByRole("button", { name: /^Bulletin$/ }).first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /^Bulletin$/ }).first().click();

  const firstGrade = page.locator('input[id^="eleves_grade_"]').first();
  await expect(firstGrade).toBeVisible();

  const originalValue = await firstGrade.inputValue();
  const updatedValue = originalValue === "7.25" ? "6.75" : "7.25";

  await page.context().setOffline(true);
  await firstGrade.fill(updatedValue);

  await expect(page.getByText(/Enregistré ✓|Enregistrement…/i)).toBeVisible();
  await expect.poll(async () => getQueuedWriteCount(page), { timeout: 10_000, intervals: [500, 1000] }).toBeGreaterThan(0);

  await page.context().setOffline(false);
  await waitForQueueToDrain(page);

  const verificationPage = await page.context().newPage();
  await loginAndOpen(verificationPage, "/eleves");
  await expect(verificationPage.getByRole("button", { name: /^Bulletin$/ }).first()).toBeVisible({ timeout: 30_000 });
  await verificationPage.getByRole("button", { name: /^Bulletin$/ }).first().click();
  await expect(verificationPage.locator('input[id^="eleves_grade_"]').first()).toHaveValue(updatedValue);
});