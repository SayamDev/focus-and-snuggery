import { describe, it, expect } from "vitest";
import { breakMinutes, focusMinutes } from "./rhythm";
import { dataSchema, defaults } from "../../types";
describe("rhythm boundaries and backwards-compatible preferences", () => {
  it("uses a longer rest only after each four Pomodoro rounds", () => {
    expect([1, 2, 3, 4, 5, 8].map((n) => breakMinutes("pomodoro", n))).toEqual([
      5, 5, 5, 15, 5, 15,
    ]);
    expect(breakMinutes("gentle", 4)).toBe(3);
    expect(focusMinutes("flexible", 7)).toBe(7);
  });
  it("loads old backups without activating an AI download", () => {
    const { voiceEngine, voiceName, voiceSpeed, ...old } = defaults;
    const restored = dataSchema.parse({
      version: 1,
      tasks: [],
      checkins: [],
      settings: old,
    });
    expect(restored.settings.voiceEngine).toBe("device");
    expect(restored.settings.voiceSpeed).toBe(1);
  });
});
