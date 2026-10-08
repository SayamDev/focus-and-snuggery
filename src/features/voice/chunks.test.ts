import { it, expect } from "vitest";
import { speechChunks } from "./chunks";
it("preserves every step in a long review without oversized model inputs", () => {
  const text = Array.from(
    { length: 40 },
    (_, i) =>
      `Step ${i + 1}. Gather the notes for this task and choose one small action you can try at your own pace.`,
  ).join(" ");
  const chunks = speechChunks(text);
  expect(text.length).toBeGreaterThan(1000);
  expect(chunks.join(" ")).toBe(text);
  expect(chunks.every((chunk) => chunk.length <= 450)).toBe(true);
  expect(chunks.at(-1)).toContain("Step 40.");
});
it("bounds an unusually long word without dropping characters", () => {
  expect(speechChunks("a".repeat(1000)).join("")).toBe("a".repeat(1000));
});
