import { describe, it, expect } from "vitest";
import {
  fallbackSplit,
  isCrisis,
  parseSteps,
  orderTasks,
  tinySteps,
} from "./tasks";
import type { Task } from "../types";
describe("safe task splitting", () => {
  it("splits cleaning into concrete small steps", () => {
    const steps = fallbackSplit("I need to clean my room");
    expect(steps[0].title).toBe("Put dirty clothes in the hamper");
    expect(steps.every((s) => s.minutes >= 2 && s.minutes <= 15)).toBe(true);
  });
  it("does not invent a completed action for an unknown thought", () =>
    expect(fallbackSplit("taxes")).toEqual([]));
  it("handles an empty dump", () => expect(fallbackSplit("   ")).toEqual([]));
  it.each([
    "I want to kill myself",
    "I don’t want to live",
    "I might hurt myself",
    "thinking about self-harm",
    "I want to end my life",
  ])("blocks crisis language: %s", (text) => {
    expect(isCrisis(text)).toBe(true);
    expect(() => fallbackSplit(text)).toThrow("crisis");
  });
  it("accepts strictly valid steps", () =>
    expect(
      parseSteps(
        '{"steps":[{"title":"Open the folder","minutes":2,"effort":"low"}]}',
      ),
    ).toHaveLength(1));
  it.each([
    "not json",
    '{"steps":[]}',
    '{"steps":[{"title":"Feel inspired","minutes":5,"effort":"low"}]}',
    '{"steps":[{"title":"Open the folder","minutes":60,"effort":"low"}]}',
  ])("rejects invalid model output", (raw) =>
    expect(() => parseSteps(raw)).toThrow(),
  );
  it("creates 3–5 smaller actions", () =>
    expect(tinySteps("Wash dishes").length).toBeGreaterThanOrEqual(3));
});
describe("energy ordering", () => {
  const tasks: Task[] = [
    {
      id: "a",
      title: "Write a paragraph",
      minutes: 10,
      effort: "high",
      order: 0,
      status: "ready",
      createdAt: 1,
    },
    {
      id: "b",
      title: "Open the document",
      minutes: 2,
      effort: "low",
      order: 1,
      status: "ready",
      createdAt: 2,
    },
    {
      id: "c",
      title: "Read the notes",
      minutes: 5,
      effort: "medium",
      order: 2,
      status: "later",
      createdAt: 3,
    },
  ];
  it("puts low effort first with low energy, without mutating storage", () => {
    expect(orderTasks(tasks, "low").map((t) => t.id)).toEqual(["b", "a"]);
    expect(tasks[0].id).toBe("a");
  });
  it("matches high energy and excludes later tasks", () =>
    expect(orderTasks(tasks, "high").map((t) => t.id)).toEqual(["a", "b"]));
  it("uses manual order for equally suitable tasks", () =>
    expect(
      orderTasks([{ ...tasks[1], id: "z", order: 3 }, tasks[1]], "low")[0].id,
    ).toBe("b"));
});
