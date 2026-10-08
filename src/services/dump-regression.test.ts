import { it, expect } from "vitest";
import { fallbackSplit } from "./tasks";
it("does not turn the screenshot’s unrecognised fragments into pretend tasks", () => {
  const steps = fallbackSplit("clean my room\nkmkmfekmkde l,el,fe");
  expect(steps).toHaveLength(3);
  expect(steps.some((s) => /kmkm|first action for/.test(s.title))).toBe(false);
});

it("reports a local fallback when optional AI has no loaded model", async () => {
  const { splitTasks } = await import("./ai");
  let usedLocal = false;
  const steps = await splitTasks("clean my room\nkmkmfekmkde", {
    ai: true,
    onFallback: () => {
      usedLocal = true;
    },
  });
  expect(usedLocal).toBe(true);
  expect(steps).toHaveLength(3);
});
