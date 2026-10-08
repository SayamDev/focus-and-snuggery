import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function skip(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip setup" }).click();
}
test("brain dump to a single focused task, completion and undo", async ({
  page,
}) => {
  await skip(page);
  await page.getByRole("button", { name: "Brain dump", exact: true }).click();
  await page.getByLabel("What’s on your mind?").fill("clean my room");
  await page.getByRole("button", { name: "Find small steps" }).click();
  await expect(
    page.getByRole("heading", { name: "Review your steps" }),
  ).toBeVisible();
  await expect(page.getByLabel("Step 1", { exact: true })).toHaveValue(
    "Put dirty clothes in the hamper",
  );
  await page.getByRole("button", { name: "Save steps" }).click();
  await expect(
    page.getByRole("heading", { name: "Put dirty clothes in the hamper" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start focus", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause focus" })).toBeVisible();
  await page.getByRole("button", { name: "Pause focus" }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Put five things back where they belong",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Put dirty clothes in the hamper" }),
  ).toBeVisible();
  await expect(page.getByText("Change undone.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Put dirty clothes in the hamper" }),
  ).toBeVisible();
});
test("crisis gate stops splitting", async ({ page }) => {
  await skip(page);
  await page.getByRole("button", { name: "Brain dump", exact: true }).click();
  await page.getByLabel("What’s on your mind?").fill("I want to kill myself");
  await page.getByRole("button", { name: "Find small steps" }).click();
  await expect(
    page.getByRole("heading", { name: "You deserve support right now" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Save steps" })).toHaveCount(0);
});
test("empty, populated and settings screens have no detected accessibility violations", async ({
  page,
}) => {
  await skip(page);
  for (const name of [
    "What’s next",
    "Brain dump",
    "Check-in",
    "Calming toolkit",
    "Settings",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});
test("check-in and settings persist; grounding is step by step", async ({
  page,
}) => {
  await skip(page);
  await page.getByRole("button", { name: "Check-in", exact: true }).click();
  await page.getByRole("button", { name: "Okay", exact: true }).click();
  await page.getByRole("button", { name: "Too loud", exact: true }).click();
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByText("Check-in saved on this device.")).toBeVisible();
  await page
    .getByRole("button", { name: "Calming toolkit", exact: true })
    .click();
  await page.getByRole("button", { name: "Start grounding" }).click();
  await expect(
    page.getByRole("heading", { name: "Name 5 things you can see" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next sense" }).click();
  await expect(
    page.getByRole("heading", { name: "Name 4 things you can feel" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Theme").selectOption("dark");
  await expect(
    page.getByText("Preference saved.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Theme")).toHaveValue("dark");
});
test("draft survives navigation; review deletion can be undone; later task returns", async ({
  page,
}) => {
  await skip(page);
  await page.getByRole("button", { name: "Brain dump", exact: true }).click();
  await page.getByLabel("What’s on your mind?").fill("clean my room");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Brain dump", exact: true }).click();
  await expect(page.getByLabel("What’s on your mind?")).toHaveValue(
    "clean my room",
  );
  await page.getByRole("button", { name: "Find small steps" }).click();
  await page
    .getByRole("button", { name: "Remove step 1", exact: true })
    .click();
  await expect(page.getByLabel("Step 1", { exact: true })).toHaveValue(
    "Put five things back where they belong",
  );
  await page.getByRole("button", { name: "Undo step edit" }).click();
  await expect(page.getByLabel("Step 1", { exact: true })).toHaveValue(
    "Put dirty clothes in the hamper",
  );
  await page.getByRole("button", { name: "Save steps" }).click();
  await page.getByRole("button", { name: "Not now", exact: true }).click();
  await page.getByRole("button", { name: "Saved for later (1)" }).click();
  await page.getByRole("button", { name: "Bring this back" }).click();
  await expect(
    page.getByRole("heading", { name: "Put dirty clothes in the hamper" }),
  ).toBeVisible();
});
test("timer warns gently and supports pause, extension and navigation", async ({
  page,
}) => {
  await skip(page);
  await page.getByRole("button", { name: "Brain dump", exact: true }).click();
  await page.getByLabel("What’s on your mind?").fill("wash dishes");
  await page.getByRole("button", { name: "Find small steps" }).click();
  await page.getByRole("button", { name: "Save steps" }).click();
  await page.clock.install();
  await page.getByRole("button", { name: "Start focus", exact: true }).click();
  await page.clock.fastForward(60000);
  await expect(
    page.getByText("About one minute left. You can pause or add time."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "What’s next", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause focus" })).toBeVisible();
  await page.getByRole("button", { name: "Pause focus" }).click();
  await page.getByRole("button", { name: "Add 2 minutes" }).click();
  await expect(page.getByRole("timer")).toHaveAccessibleName(/3 minutes/);
});
test("validated backup import, deletion confirmation and undo", async ({
  page,
}) => {
  await skip(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const backup = {
    version: 1,
    tasks: [
      {
        id: "backup-task",
        title: "Open the notebook",
        minutes: 2,
        effort: "low",
        status: "ready",
        order: 0,
        createdAt: 1,
      },
    ],
    checkins: [],
    settings: {
      theme: "light",
      font: "default",
      textSize: "normal",
      reducedMotion: false,
      mode: "simple",
      notification: "none",
      tone: "warm",
      quiet: false,
      country: "GB",
      onboarded: true,
    },
  };
  await page.getByLabel("Choose backup file").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole("button", { name: "Replace with backup" }).click();
  await page.getByText("Backup imported.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "What’s next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Open the notebook" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete everything", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep my data" }).click();
  await page
    .getByRole("button", { name: "Delete everything", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm deletion" }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByText("Change undone.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "What’s next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Open the notebook" }),
  ).toBeVisible();
});
test("fractional task minutes are rejected before saving; smaller steps receive focus", async ({
  page,
}) => {
  await skip(page);
  await page.getByRole("button", { name: "Brain dump", exact: true }).click();
  await page.getByLabel("What’s on your mind?").fill("clean my room");
  await page.getByRole("button", { name: "Find small steps" }).click();
  await page.getByRole("button", { name: "Save steps" }).click();
  await page.getByRole("button", { name: "Edit task", exact: true }).click();
  await page.getByLabel("Estimated minutes").fill("2.5");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(
    page.getByText(
      "Use a title of at least three characters and a whole number of minutes from 2 to 15.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Estimated minutes")).toBeFocused();
  await expect(page.getByRole("timer")).toHaveAccessibleName(/5 minutes/);
  await page.getByRole("button", { name: "Cancel edit" }).click();
  await page.getByRole("button", { name: "Make it smaller" }).click();
  await expect(
    page.getByRole("heading", { name: "Try these smaller steps" }),
  ).toBeFocused();
});

test("main flow works using only keyboard input", async ({ page }) => {
  await page.goto("/");
  async function tabTo(target: import("@playwright/test").Locator) {
    for (let i = 0; i < 60; i++) {
      if (await target.evaluate((el) => el === document.activeElement)) return;
      await page.keyboard.press("Tab");
    }
    throw new Error("Could not reach the control using Tab");
  }
  await tabTo(page.getByRole("button", { name: "Skip setup" }));
  await page.keyboard.press("Enter");
  await tabTo(page.getByRole("button", { name: "Brain dump", exact: true }));
  await page.keyboard.press("Enter");
  await tabTo(page.getByLabel("What’s on your mind?"));
  await page.keyboard.type("clean my room");
  await tabTo(page.getByRole("button", { name: "Find small steps" }));
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: "Review your steps" }).waitFor();
  await tabTo(page.getByRole("button", { name: "Save steps" }));
  await page.keyboard.press("Enter");
  await tabTo(page.getByRole("button", { name: "Start focus", exact: true }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Pause focus" })).toBeFocused();
  await page.keyboard.press("Enter");
  await tabTo(page.getByRole("button", { name: "Done", exact: true }));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "Put five things back where they belong",
    }),
  ).toBeVisible();
});
