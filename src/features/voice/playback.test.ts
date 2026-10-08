import { afterEach, expect, it, vi } from "vitest";
vi.mock("./naturalVoice", () => ({
  voiceState: () => ({ status: "ready" }),
  generateVoice: vi.fn(async () => new Blob(["audio"])),
}));
import { generateVoice } from "./naturalVoice";
import { speak, stopSpeaking, playbackState } from "./playback";
import { defaults } from "../../types";
const settings = { ...defaults, voiceEngine: "natural" as const };
class FakeAudio {
  src = "";
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(async () => {
    setTimeout(() => this.onended?.(), 0);
  });
  pause = vi.fn();
}
function setup() {
  vi.stubGlobal("window", { speechSynthesis: { cancel: vi.fn() } });
  vi.stubGlobal("Audio", FakeAudio);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
}
afterEach(() => {
  stopSpeaking();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.mocked(generateVoice).mockClear();
});
it("reads every chunk and returns to idle after the last one", async () => {
  setup();
  const text = Array.from(
    { length: 40 },
    (_, i) =>
      `Step ${i + 1}. Put one item away and take a moment before the next step.`,
  ).join(" ");
  await speak("review", text, settings);
  expect(
    vi
      .mocked(generateVoice)
      .mock.calls.map((c) => c[0])
      .join(" "),
  ).toBe(text);
  expect(playbackState().status).toBe("idle");
});
it("stopping during generation prevents playback and remaining chunks", async () => {
  setup();
  let resolve!: (blob: Blob) => void;
  vi.mocked(generateVoice).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const work = speak("review", "A small step. ".repeat(100), settings);
  expect(playbackState().status).toBe("preparing");
  stopSpeaking();
  resolve(new Blob(["audio"]));
  await work;
  expect(generateVoice).toHaveBeenCalledTimes(1);
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(playbackState().status).toBe("idle");
});
