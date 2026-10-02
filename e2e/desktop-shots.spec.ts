import { test, type Page } from "@playwright/test";

// Desktop layout captures (nav rail + two-column study, Learn, Practice).
test.describe("desktop screenshots", () => {
  test.skip(({ viewport }) => !viewport || viewport.width <= 540, "desktop viewports only");

  const shot = async (page: Page, name: string) => {
    const dir = test.info().project.name;
    await page.waitForTimeout(500);
    await page.screenshot({ path: `screenshots/${dir}/${name}.png`, fullPage: false });
  };

  test("Plays desktop (Man · pro · pass)", async ({ page }) => {
    await page.goto("#/plays?call=Man&ball=left&formation=pro&outcome=pass");
    await page.locator(".field-svg").waitFor();
    await shot(page, "desktop-plays");
  });

  test("Play menu open (Power · i · run)", async ({ page }) => {
    await page.goto("#/plays?call=Power&ball=left&formation=i&outcome=run");
    await page.locator(".field-viewport").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Change the play/ }).click();
    await page.getByRole("menu", { name: "Change the play" }).waitFor();
    await page.waitForTimeout(300);
    await shot(page, "desktop-play-menu");
  });

  test("Phase chips (stop-light)", async ({ page }) => {
    await page.goto("#/plays?call=Power&ball=left&formation=i&outcome=run");
    const chips = page.locator(".phase-chips");
    await chips.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await chips.screenshot({ path: `screenshots/${test.info().project.name}/phase-chips.png` });
  });

  test("Learn desktop", async ({ page }) => {
    await page.goto("#/learn");
    await page.getByRole("heading", { name: "Learn", exact: true }).waitFor();
    await shot(page, "desktop-learn");
  });

  test("Practice desktop (mid-rep)", async ({ page }) => {
    await page.goto("#/practice");
    await page.getByRole("button", { name: "Start session" }).click();
    await page.getByRole("button", { name: "Reveal the answer" }).click();
    await shot(page, "desktop-practice");
  });
});
