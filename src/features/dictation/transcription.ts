import type { ListenIn, ListenOut } from "./listen.worker";
export type ListenerState = {
  status: "idle" | "loading" | "ready" | "error";
  message: string;
};
let state: ListenerState = { status: "idle", message: "" };
const listeners = new Set<() => void>();
export const listenerState = () => state;
export function subscribeListener(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function emit(next: ListenerState) {
  state = next;
  listeners.forEach((fn) => fn());
}
let worker: Worker | null = null;
let timeout: ReturnType<typeof setTimeout> | undefined;
let sequence = 0;
const pending = new Map<
  number,
  {
    resolve: (text: string) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
export function cancelListener() {
  clearTimeout(timeout);
  worker?.terminate();
  worker = null;
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error("Transcription cancelled."));
  }
  pending.clear();
  emit({ status: "idle", message: "" });
}
function fail(message: string) {
  cancelListener();
  emit({ status: "error", message });
}
export function loadListener() {
  if (state.status === "ready" || state.status === "loading") return;
  emit({ status: "loading", message: "Preparing private dictation…" });
  timeout = setTimeout(
    () =>
      fail(
        "The speech model took too long to load. Check your connection and retry.",
      ),
    300_000,
  );
  try {
    worker = new Worker(new URL("./listen.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onerror = () =>
      fail(
        "Private dictation could not start in this browser. Try an up-to-date Chrome, Edge or Firefox.",
      );
    worker.onmessage = ({ data }: MessageEvent<ListenOut>) => {
      if (data.type === "progress")
        emit({
          status: "loading",
          message: `Downloaded ${(data.loaded / 1_000_000).toFixed(1)} MB. Loading the speech model…`,
        });
      if (data.type === "ready") {
        clearTimeout(timeout);
        emit({
          status: "ready",
          message: "Ready to record. Your microphone is still off.",
        });
      }
      if (data.type === "error")
        fail(
          "The speech model could not load. Check your connection and retry.",
        );
      if (data.type === "text") {
        const request = pending.get(data.id);
        if (!request) return;
        clearTimeout(request.timer);
        pending.delete(data.id);
        if (data.text === null)
          request.reject(
            new Error("Could not transcribe this recording. Please try again."),
          );
        else request.resolve(data.text);
      }
    };
    worker.postMessage({ type: "load" } satisfies ListenIn);
  } catch {
    fail("Private dictation is unavailable in this browser.");
  }
}
export function microphoneError(error: unknown): string {
  const name =
    error instanceof DOMException || error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Microphone access is blocked. Allow microphone access for this site and for this browser in your device’s privacy settings, then try again.";
  if (name === "NotFoundError")
    return "No microphone was found. Connect a microphone and try again.";
  if (name === "NotReadableError" || name === "AbortError")
    return "The microphone could not open. Close other apps using it and try again.";
  return "The microphone could not start here. Try opening this app in an up-to-date Chrome, Edge or Firefox.";
}
export function hasSpeech(samples: Float32Array): boolean {
  if (samples.length < 1600) return false;
  let voiced = 0;
  for (let start = 0; start < samples.length; start += 1600) {
    let sum = 0;
    const end = Math.min(start + 1600, samples.length);
    for (let i = start; i < end; i++) sum += samples[i] * samples[i];
    if (Math.sqrt(sum / (end - start)) > 0.003) voiced++;
  }
  return voiced >= 2;
}
export async function transcribeRecording(blob: Blob): Promise<string> {
  if (state.status !== "ready" || !worker)
    throw new Error("Load private dictation before recording.");
  const ctx = new AudioContext();
  let samples: Float32Array;
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const duration = Math.min(decoded.duration, 31);
    if (duration < 0.15)
      throw new Error("The recording was too short. Try a full sentence.");
    const offline = new OfflineAudioContext(
      1,
      Math.ceil(duration * 16000),
      16000,
    );
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    samples = (await offline.startRendering()).getChannelData(0);
  } finally {
    await ctx.close();
  }
  if (!hasSpeech(samples))
    throw new Error(
      "No clear speech was detected. Check your microphone and try again.",
    );
  const id = ++sequence;
  const text = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        fail(
          "Transcription took too long. Please reload private dictation and try a shorter recording.",
        ),
      60_000,
    );
    pending.set(id, { resolve, reject, timer });
    worker!.postMessage(
      { type: "transcribe", id, audio: samples } satisfies ListenIn,
      [samples.buffer],
    );
  });
  if (
    !text.trim() ||
    /^\s*[[(]?(blank_audio|silence|music)[\])]?\s*$/i.test(text)
  )
    throw new Error(
      "No clear speech was detected. Try again, or type your note.",
    );
  return text.trim();
}
export async function removeListener() {
  cancelListener();
  try {
    if ((await caches.keys()).includes("transformers-cache")) {
      const cache = await caches.open("transformers-cache");
      for (const request of await cache.keys())
        if (request.url.includes("whisper-tiny.en"))
          await cache.delete(request);
    }
    emit({ status: "idle", message: "Saved dictation model removed." });
  } catch {
    emit({
      status: "error",
      message:
        "Could not remove the saved model. Try your browser’s site-storage controls.",
    });
  }
}
