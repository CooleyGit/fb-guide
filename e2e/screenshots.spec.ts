import { test, expect, type Page } from "@playwright/test";

// Representative mobile screenshots: trips, empty, I, and double TE, on both
// sides, including Man, hidden answers, fit/detail, and an animation midpoint.
test.describe("mobile screenshots", () => {
  test.skip(({ viewport }) => !viewport || viewport.width > 540, "mobile viewports only");

  const shot = async (page: Page, name: string) => {
    const dir = test.info().project.name;
    await page.locator(".field-svg").waitFor();
    await page.locator(".field-viewport").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // let layout + alignment settle
    await page.screenshot({ path: `screenshots/${dir}/${name}.png` });
  };

  const go = (params: Record<string, string>) =>
    `#/plays?${new URLSearchParams(params).toString()}`;

  test("Man · trips · left (detail default)", async ({ page }) => {
    await page.goto(go({ call: "Man", ball: "left", formation: "trips", outcome: "read" }));
    await shot(page, "man-trips-left-detail");
  });

  test("Man · trips · right", async ({ page }) => {
    await page.goto(go({ call: "Man", ball: "right", formation: "trips", outcome: "read" }));
    await shot(page, "man-trips-right-detail");
  });

  test("Man · I · left · pass (TE outside leverage)", async ({ page }) => {
    await page.goto(go({ call: "Man", ball: "left", formation: "i", outcome: "pass" }));
    await shot(page, "man-i-left-pass");
  });

  test("Man · double · right · read", async ({ page }) => {
    await page.goto(go({ call: "Man", ball: "right", formation: "double", outcome: "read" }));
    await shot(page, "man-double-right-read");
  });

  test("Zone · empty · left · pass", async ({ page }) => {
    await page.goto(go({ call: "Zone", ball: "left", formation: "empty", outcome: "pass" }));
    await shot(page, "zone-empty-left-pass");
  });

  test("Power · I · left · run (fit field)", async ({ page }) => {
    await page.goto(go({ call: "Power", ball: "left", formation: "i", outcome: "run" }));
    await page.getByRole("button", { name: "Fit field" }).click();
    await shot(page, "power-i-left-run-fit");
  });

  test("Power · I · left · run (animation midpoint)", async ({ page }) => {
    await page.goto(go({ call: "Power", ball: "left", formation: "i", outcome: "run" }));
    await page.$eval('input[type="range"]', (el) => {
      const input = el as HTMLInputElement;
      input.value = "680";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.waitForTimeout(300);
    await shot(page, "power-i-left-run-midpoint");
  });

  test("Man · trips · left · hidden answers", async ({ page }) => {
    await page.goto(go({ call: "Man", ball: "left", formation: "trips", outcome: "pass" }));
    await page.getByRole("button", { name: "Hide answers" }).click();
    await expect(page.locator(".kind-ss")).toHaveCount(0);
    await shot(page, "man-trips-left-hidden");
  });

  const scrub = async (page: Page, value: number) => {
    await page.$eval(
      'input[type="range"]',
      (el, v) => {
        const input = el as HTMLInputElement;
        input.value = String(v);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      },
      value,
    );
    await page.waitForTimeout(250);
  };

  test("Power · I · left · run — tackle finish (strong)", async ({ page }) => {
    await page.goto(go({ call: "Power", ball: "left", formation: "i", outcome: "run" }));
    await scrub(page, 950);
    await shot(page, "power-i-left-run-finish");
  });

  test("Power · I · left · run — pursuit angle (away)", async ({ page }) => {
    await page.goto(go({ call: "Power", ball: "left", formation: "i", outcome: "run" }));
    await page.getByRole("radio", { name: "Away from you" }).click();
    await scrub(page, 760);
    await shot(page, "power-i-left-run-weak");
  });
});
