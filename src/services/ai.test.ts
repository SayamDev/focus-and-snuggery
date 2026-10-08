import { it, expect, vi } from "vitest";
import { RuleAI, WebLLMAI, splitTasks } from "./ai";
it("always supports splitting without a model", async () =>
  expect(await new RuleAI().split("clean room")).toHaveLength(3));
it("unloaded model falls back deterministically", async () =>
  expect(await new WebLLMAI().split("dishes")).toHaveLength(2));
it("blocks crisis before model inference", async () =>
  expect(splitTasks("I want to end my life", { ai: true })).rejects.toThrow(
    "crisis",
  ));
it("retries invalid output once then falls back", async () => {
  const ai = new WebLLMAI();
  const create = vi
    .fn()
    .mockResolvedValue({ choices: [{ message: { content: '{"steps":[]}' } }] });
  // Inject the model boundary, without a WebGPU device or network download.
  Object.assign(ai, { engine: { chat: { completions: { create } } } });
  const steps = await ai.split("clean room");
  expect(create).toHaveBeenCalledTimes(2);
  expect(steps[0].title).toBe("Put dirty clothes in the hamper");
});
