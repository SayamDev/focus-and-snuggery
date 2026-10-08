import { test, expect } from "@playwright/test";
async function open(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip setup" }).click();
  await page.getByRole("button", { name: "Brain dump", exact: true }).click();
}
test("Enter reviews a dump, Shift+Enter keeps a new line, and Save opens the next task", async ({
  page,
}) => {
  await open(page);
  const note = page.getByLabel("What’s on your mind?");
  await note.fill("clean my room");
  await note.press("Shift+Enter");
  await note.pressSequentially("kmkmfekmkde l,el,fe");
  await note.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Review your steps" }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", {
      name: "Some thoughts need a little more detail",
    }),
  ).toBeVisible();
  await expect(page.locator("[data-step-title]")).toHaveCount(3);
  await page.getByRole("button", { name: "Save steps", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Put dirty clothes in the hamper" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Brain dump", exact: true }).click();
  await expect(note).toHaveValue("kmkmfekmkde l\nel\nfe");
});
test("unrecognised input offers clarification and manual steps instead of bogus tasks", async ({
  page,
}) => {
  await open(page);
  await page.getByLabel("What’s on your mind?").fill("kmkmfekmkde");
  await page.getByLabel("What’s on your mind?").press("Enter");
  await expect(
    page.getByRole("heading", { name: "Let’s make this a little clearer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save steps", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Add a step", exact: true }).click();
  await page.getByLabel("Step 1", { exact: true }).fill("Call the dentist");
  await page.getByRole("button", { name: "Save steps", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Call the dentist" }),
  ).toBeVisible();
});
test("microphone setup explains the local flow and cancellation never starts capture", async ({
  page,
}) => {
  const microphoneCalls: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: () => {
          throw new Error("Microphone must not start during setup");
        },
      },
    });
  });
  page.on("pageerror", (e) => microphoneCalls.push(e.message));
  await open(page);
  await page
    .getByRole("button", { name: "Use microphone", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Say it, then check it" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Load private dictation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load private dictation" }).click();
  await page.getByRole("button", { name: "Cancel setup" }).click();
  await expect(
    page.getByRole("button", { name: "Load private dictation" }),
  ).toBeVisible();
  expect(microphoneCalls).toEqual([]);
});
