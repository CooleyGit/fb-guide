import { test, expect, type Page } from "@playwright/test";

function playUrl(params: Record<string, string>): string {
  return `#/plays?${new URLSearchParams(params).toString()}`;
}

async function expectNoConsoleErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await run();
  expect(errors, errors.join("\n")).toEqual([]);
}

test("loads Plays by default with the SS field", async ({ page }) => {
  await expectNoConsoleErrors(page, async () => {
    await page.goto("");
    await expect(page).toHaveURL(/#\/plays/);
    await expect(page.locator(".field-svg")).toBeVisible();
    await expect(page.getByText("Defense above · offense below")).toBeVisible();
  });
});

test("navigates all three destinations and back", async ({ page }) => {
  await page.goto("#/plays");
  // Rail (desktop) and bottom-nav (mobile) share names; target the visible one.
  const navLink = (name: string) => page.getByRole("link", { name }).and(page.locator(":visible"));

  await navLink("Practice").click();
  await expect(page).toHaveURL(/#\/practice/);
  await expect(page.getByRole("heading", { name: "Practice" })).toBeVisible();

  await navLink("Learn").click();
  await expect(page).toHaveURL(/#\/learn/);
  await expect(page.getByRole("heading", { name: "Learn", exact: true })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/#\/practice/);
});

test("a shared rep link reloads to the same scenario", async ({ page }) => {
  await page.goto(playUrl({ call: "Man", ball: "left", formation: "i", outcome: "pass" }));
  await expect(page.getByRole("heading", { name: /Man · I-formation · Ball On Left Hash/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /Man · I-formation · Ball On Left Hash/ })).toBeVisible();
});

test("unknown route shows a recovery screen", async ({ page }) => {
  await page.goto("#/nonsense");
  await expect(page.getByRole("heading", { name: /isn’t here/ })).toBeVisible();
  await page.getByRole("link", { name: "Go to Plays" }).click();
  await expect(page).toHaveURL(/#\/plays/);
});

test("malformed query parameters fall back safely", async ({ page }) => {
  await expectNoConsoleErrors(page, async () => {
    await page.goto("#/plays?call=Bogus&ball=sideways&formation=zzz&outcome=punt");
    await expect(page.locator(".field-svg")).toBeVisible();
    await expect(page.locator(".scenario-title")).toBeVisible();
  });
});

test("hide answers removes the SS assignment path", async ({ page }) => {
  await page.goto(playUrl({ call: "Power", ball: "left", formation: "i", outcome: "run" }));
  await expect(page.locator(".kind-ss")).toHaveCount(1);
  await page.getByRole("button", { name: "Field view options" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Hide answers" }).click();
  await expect(page.locator(".kind-ss")).toHaveCount(0);
  // Offense still present (the stimulus).
  await expect(page.locator(".player.offense").first()).toBeVisible();
});

test("the field view menu switches to the whole-field view", async ({ page }) => {
  await page.goto(playUrl({ call: "Man", ball: "left", formation: "trips", outcome: "run" }));
  await page.getByRole("button", { name: "Field view options" }).click();
  await page.getByRole("menuitemradio", { name: "Whole field" }).click();
  await expect(page.getByRole("menuitemradio", { name: "Whole field" })).toHaveAttribute("aria-checked", "true");
});

test("notes panel can be collapsed for a full-width field", async ({ page, viewport }) => {
  test.skip(!viewport || viewport.width <= 760, "desktop layout only");
  await page.goto(playUrl({ call: "Man", ball: "left", formation: "i", outcome: "run" }));
  await expect(page.locator(".notes-column")).toBeVisible();
  await page.getByRole("button", { name: "Field view options" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Notes panel" }).click();
  await expect(page.locator(".notes-column")).toHaveCount(0);
});

test("choosing a run shows the ball-direction control", async ({ page }) => {
  await page.goto(playUrl({ call: "Power", ball: "left", formation: "i", outcome: "pass" }));
  await expect(page.getByRole("radio", { name: "Away from you" })).toHaveCount(0);
  await page.getByRole("radio", { name: "Run", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Away from you" })).toBeVisible();
});

test("opening a contextual tip shows an explanation", async ({ page }) => {
  await page.goto(playUrl({ call: "Man", ball: "left", formation: "pro", outcome: "read" }));
  await page.getByRole("button", { name: /Tip: Your job/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("playback advances the timeline", async ({ page }) => {
  await page.goto(playUrl({ call: "Power", ball: "left", formation: "i", outcome: "run" }));
  const scrubber = page.getByRole("slider", { name: "Play progress" });
  await expect(scrubber).toHaveValue("0");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const value = Number(await scrubber.inputValue());
  expect(value).toBeGreaterThan(0);
});

test("Learn search finds a vocabulary term", async ({ page }) => {
  await page.goto("#/learn");
  await page.getByRole("searchbox").fill("spill");
  await expect(
    page.getByText("Make the runner bounce outside toward a force defender.", { exact: true }),
  ).toBeVisible();
});

test("a full practice rep flow records self-review", async ({ page }) => {
  await page.goto("#/practice");
  await page.getByRole("button", { name: "Start session" }).click();
  await expect(page.getByText(/Rep 1 of 5/)).toBeVisible();
  await page.getByRole("button", { name: "Reveal the answer" }).click();
  await expect(page.getByRole("button", { name: "Got it" })).toBeVisible();
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByText(/Rep 2 of 5/)).toBeVisible();
});
