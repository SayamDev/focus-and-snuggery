import { test, expect } from "@playwright/test";
async function task(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip setup" }).click();
  await page.getByRole("button", { name: "Brain dump", exact: true }).click();
  await page.getByRole("button", { name: "Tidy a space" }).click();
  await expect(page.getByLabel("What’s on your mind?")).toHaveValue(
    "clean my room",
  );
  await page.getByRole("button", { name: "Find small steps" }).click();
  await expect(
    page.getByRole("button", { name: "Read my steps" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save steps" }).click();
}
test("gentle rhythm waits for each phase, continues across tasks, and pauses", async ({
  page,
}) => {
  await page.clock.install();
  await task(page);
  await page.getByLabel("Focus rhythm").selectOption("gentle");
  await expect(page.getByRole("timer")).toHaveAccessibleName(
    "10 minutes 0 seconds remaining",
  );
  await page.getByRole("button", { name: "Start focus", exact: true }).click();
  await page.clock.fastForward(120_000);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause focus", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("timer")).toHaveAccessibleName(
    "8 minutes 0 seconds remaining",
  );
  await page.clock.fastForward(480_000);
  await page.getByRole("button", { name: "Take a 3-minute break" }).click();
  await expect(
    page.getByRole("button", { name: "Start break", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(60_000);
  await expect(page.getByRole("timer")).toHaveAccessibleName(
    "3 minutes 0 seconds remaining",
  );
  await page.getByRole("button", { name: "Start break", exact: true }).click();
  await page.clock.fastForward(60_000);
  await page.getByRole("button", { name: "Pause break", exact: true }).click();
  await page.clock.fastForward(60_000);
  await expect(page.getByRole("timer")).toHaveAccessibleName(
    "2 minutes 0 seconds remaining",
  );
  await page.getByRole("button", { name: "Start break", exact: true }).click();
  await page.clock.fastForward(120_000);
  await page.getByRole("button", { name: "Prepare next focus round" }).click();
  await expect(page.getByRole("timer")).toHaveAccessibleName(
    "10 minutes 0 seconds remaining",
  );
});
test("Pomodoro offers a long rest after four rounds without auto-starting", async ({
  page,
}) => {
  await page.clock.install();
  await task(page);
  await page.getByLabel("Focus rhythm").selectOption("pomodoro");
  for (let round = 1; round <= 4; round++) {
    await page
      .getByRole("button", { name: "Start focus", exact: true })
      .click();
    await page.clock.fastForward(25 * 60_000);
    await expect(
      page.getByRole("button", {
        name: `Take a ${round === 4 ? 15 : 5}-minute break`,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: `Take a ${round === 4 ? 15 : 5}-minute break`,
      })
      .click();
    if (round < 4) {
      await page
        .getByRole("button", { name: "Start break", exact: true })
        .click();
      await page.clock.fastForward(5 * 60_000);
      await page
        .getByRole("button", { name: "Prepare next focus round" })
        .click();
    }
  }
  await expect(page.getByRole("timer")).toHaveAccessibleName(
    "15 minutes 0 seconds remaining",
  );
  await expect(
    page.getByRole("button", { name: "Start break", exact: true }),
  ).toBeVisible();
});
test("thought capture preserves a running timer and is saved to Later", async ({
  page,
}) => {
  await page.clock.install();
  await task(page);
  await page.getByRole("button", { name: "Start focus", exact: true }).click();
  await page.clock.fastForward(60_000);
  await page
    .getByRole("button", { name: "Something else on your mind?" })
    .click();
  await page.getByLabel("Save a thought for later").fill("Buy oat milk");
  await page
    .getByRole("button", { name: "Save to Later", exact: true })
    .click();
  await page
    .getByText("Thought saved to Later. You can return to this task.", {
      exact: true,
    })
    .waitFor();
  await expect(page.getByRole("button", { name: "Pause focus" })).toBeVisible();
  await expect(page.getByRole("timer")).toHaveAccessibleName(
    "4 minutes 0 seconds remaining",
  );
  await page.getByRole("button", { name: /Saved for later/ }).click();
  await expect(page.getByText("Buy oat milk", { exact: true })).toBeVisible();
});
test("natural voice is opt-in; failure and cancellation leave the app usable", async ({
  page,
}) => {
  const modelRequests: string[] = [];
  page.on("request", (r) => {
    if (/huggingface|cdn.jsdelivr/.test(r.url())) modelRequests.push(r.url());
  });
  await task(page);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  expect(modelRequests).toEqual([]);
  await page.getByLabel("Read-aloud voice").selectOption("natural");
  await page.getByLabel("Voice style").selectOption("af_heart");
  await page.getByLabel("Reading pace").selectOption("0.8");
  await page.getByRole("button", { name: "Try this voice" }).click();
  await expect(
    page.getByText("Open Settings → Voice and load the natural voice first."),
  ).toBeVisible();
  expect(modelRequests).toEqual([]);
  await page.route("**/*huggingface.co/**", (route) => route.abort());
  await page.getByRole("button", { name: "Load natural voice" }).click();
  await expect(
    page.getByRole("button", { name: "Cancel voice download" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel voice download" }).click();
  await expect(
    page.getByRole("button", { name: "Load natural voice" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Voice style")).toHaveValue("af_heart");
  await expect(page.getByLabel("Reading pace")).toHaveValue("0.8");
});

test("extending a finished round does not count the same round twice", async ({
  page,
}) => {
  await page.clock.install();
  await task(page);
  await page.getByLabel("Focus rhythm").selectOption("gentle");
  await page.getByRole("button", { name: "Start focus", exact: true }).click();
  await page.clock.fastForward(10 * 60_000);
  await expect(
    page.getByText("1 focus round finished", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add 2 minutes" }).click();
  await page.getByRole("button", { name: "Start focus", exact: true }).click();
  await page.clock.fastForward(2 * 60_000);
  await expect(
    page.getByText("1 focus round finished", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Take a 3-minute break" }),
  ).toBeVisible();
});

test("a rhythm can still be paused after completing the last task", async ({
  page,
}) => {
  await page.clock.install();
  await task(page);
  await page.getByLabel("Focus rhythm").selectOption("gentle");
  await page.getByRole("button", { name: "Start focus", exact: true }).click();
  for (
    let i = 0;
    i < 10 &&
    (await page.getByRole("button", { name: "Done", exact: true }).count());
    i++
  ) {
    await page.getByRole("button", { name: "Done", exact: true }).click();
  }
  await expect(
    page.getByRole("button", { name: "Pause focus", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Pause focus", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start focus", exact: true }),
  ).toBeDisabled();
});
