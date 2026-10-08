import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("welcome is modal, saves a name, begins a dump and does not repeat", async ({
  page,
}) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome. Make yourself at home." }),
  ).toBeFocused();
  await page.getByLabel("What should we call you?").fill("Alex");
  await page.getByRole("button", { name: "Start with a brain dump" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel("What’s on your mind?")).toBeVisible();
  await page.getByRole("button", { name: "What’s next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "One thing at a time, Alex" }),
  ).toBeVisible();
  await page.reload();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "One thing at a time, Alex" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Show introduction" }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
});

test("welcome voice is opt-in, cancellation and failure do not block entering", async ({
  page,
}) => {
  let modelRequests = 0;
  await page.route("https://huggingface.co/**", async (route) => {
    modelRequests++;
    await route.abort();
  });
  await page.goto("/");
  expect(modelRequests).toBe(0);
  await page
    .getByRole("button", { name: "Load natural voice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel download", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel download", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Load natural voice", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore the app" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("welcome fits mobile, contains keyboard focus and has no axe violations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  expect(
    await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
