import { afterEach, expect, it, vi } from "vitest";
import { startRecording, recordingAvailable } from "./recorder";
import { hasSpeech, microphoneError } from "./transcription";
afterEach(() => vi.unstubAllGlobals());
it("records without the browser speech-recognition service and releases tracks on stop", async () => {
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] };
  vi.stubGlobal("navigator", {
    mediaDevices: { getUserMedia: vi.fn(async () => stream) },
  });
  class Recorder {
    state = "inactive";
    mimeType = "audio/webm";
    ondataavailable: ((e: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    onerror = null;
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["sample"]) });
      queueMicrotask(() => this.onstop?.());
    }
  }
  vi.stubGlobal("MediaRecorder", Recorder);
  expect(recordingAvailable()).toBe(true);
  const callbacks = { onStart: vi.fn(), onClip: vi.fn(), onError: vi.fn() };
  const recording = startRecording(callbacks);
  await Promise.resolve();
  expect(callbacks.onStart).toHaveBeenCalledOnce();
  recording.stop();
  await Promise.resolve();
  expect(track.stop).toHaveBeenCalled();
  expect(callbacks.onClip).toHaveBeenCalledOnce();
  recording.cancel();
});
it("cancelling a permission prompt closes a late stream without recording", async () => {
  const track = { stop: vi.fn() };
  let grant!: (stream: unknown) => void;
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: () =>
        new Promise((resolve) => {
          grant = resolve;
        }),
    },
  });
  vi.stubGlobal("MediaRecorder", vi.fn());
  const callbacks = { onStart: vi.fn(), onClip: vi.fn(), onError: vi.fn() };
  const recording = startRecording(callbacks);
  recording.cancel();
  grant({ getTracks: () => [track] });
  await Promise.resolve();
  expect(track.stop).toHaveBeenCalledOnce();
  expect(callbacks.onStart).not.toHaveBeenCalled();
});
it("describes denied microphone permission and does not claim to be recording", async () => {
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi.fn(async () => {
        throw new DOMException("denied", "NotAllowedError");
      }),
    },
  });
  vi.stubGlobal("MediaRecorder", vi.fn());
  const callbacks = { onStart: vi.fn(), onClip: vi.fn(), onError: vi.fn() };
  startRecording(callbacks);
  await Promise.resolve();
  expect(callbacks.onStart).not.toHaveBeenCalled();
  expect(callbacks.onError).toHaveBeenCalledWith(
    expect.stringContaining("Microphone access is blocked"),
  );
  expect(
    microphoneError(new DOMException("missing", "NotFoundError")),
  ).toContain("No microphone");
});
it("rejects silence before an ASR model can invent a transcript", () => {
  expect(hasSpeech(new Float32Array(16000))).toBe(false);
  expect(
    hasSpeech(
      Float32Array.from({ length: 16000 }, (_, i) => Math.sin(i / 12) * 0.05),
    ),
  ).toBe(true);
});
