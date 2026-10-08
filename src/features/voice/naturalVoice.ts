import type { WorkerIn, WorkerOut } from "./kokoro.worker";
export type VoiceState = {
  status: "idle" | "loading" | "ready" | "error";
  loaded: number;
  message: string;
};
let state: VoiceState = { status: "idle", loaded: 0, message: "" };
const listeners = new Set<() => void>();
export const voiceState = () => state;
export function subscribeVoice(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function emit(next: Partial<VoiceState>) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
}
let worker: Worker | null = null;
let watchdog: ReturnType<typeof setTimeout> | undefined;
let nextId = 0;
const requests = new Map<
  number,
  {
    resolve: (blob: Blob) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
export function cancelVoiceLoad() {
  clearTimeout(watchdog);
  worker?.terminate();
  worker = null;
  for (const request of requests.values()) {
    clearTimeout(request.timer);
    request.reject(new Error("Voice stopped."));
  }
  requests.clear();
  emit({ status: "idle", loaded: 0, message: "" });
}
function fail(message: string) {
  cancelVoiceLoad();
  emit({ status: "error", message });
}
export function loadNaturalVoice() {
  if (state.status === "loading" || state.status === "ready") return;
  if (typeof Worker === "undefined" || typeof WebAssembly === "undefined") {
    fail(
      "This browser cannot run the natural voice. Try a device voice instead.",
    );
    return;
  }
  emit({
    status: "loading",
    loaded: 0,
    message: "Starting the voice download…",
  });
  // A bounded load includes model initialization, even if the worker stops reporting progress.
  watchdog = setTimeout(
    () =>
      fail(
        "The voice took too long to load. Check your connection and try again.",
      ),
    300_000,
  );
  try {
    worker = new Worker(new URL("./kokoro.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onerror = () =>
      fail(
        "The natural voice could not start. You can retry or use a device voice.",
      );
    worker.onmessage = ({ data }: MessageEvent<WorkerOut>) => {
      if (data.type === "progress")
        emit({
          loaded: data.loaded,
          message: `Downloaded ${(data.loaded / 1_000_000).toFixed(1)} MB. Preparing the natural voice…`,
        });
      if (data.type === "warming")
        emit({ message: "Download complete. Warming up the voice…" });
      if (data.type === "ready") {
        clearTimeout(watchdog);
        emit({
          status: "ready",
          message: "Natural voice is ready on this device.",
        });
      }
      if (data.type === "error")
        fail("The voice could not load. Check your connection and try again.");
      if (data.type === "audio") {
        const request = requests.get(data.id);
        if (!request) return;
        clearTimeout(request.timer);
        requests.delete(data.id);
        if (data.blob) request.resolve(data.blob);
        else
          request.reject(
            new Error(
              "Could not create this audio. Try again or use a device voice.",
            ),
          );
      }
    };
    worker.postMessage({ type: "load" } satisfies WorkerIn);
  } catch {
    fail("The voice could not start in this browser.");
  }
}
export function generateVoice(
  text: string,
  voice: string,
  speed: number,
): Promise<Blob> {
  if (!worker || state.status !== "ready")
    return Promise.reject(
      new Error("Load the natural voice in Settings first."),
    );
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        fail(
          "The voice took too long. Please reload the natural voice and try a shorter line.",
        ),
      60_000,
    );
    requests.set(id, { resolve, reject, timer });
    worker!.postMessage({
      type: "generate",
      id,
      text,
      voice,
      speed,
    } satisfies WorkerIn);
  });
}
export async function removeNaturalVoice() {
  cancelVoiceLoad();
  try {
    // Delete only this model, never another feature's cache or user data.
    if ((await caches.keys()).includes("transformers-cache")) {
      const cache = await caches.open("transformers-cache");
      const entries = await cache.keys();
      for (const request of entries)
        if (request.url.includes("Kokoro-82M")) await cache.delete(request);
    }
    await caches.delete("kokoro-voices");
    emit({
      message:
        "Saved voice model and styles removed. Shared runtime files may remain.",
    });
  } catch {
    emit({
      status: "error",
      message:
        "Could not remove the saved voice model. Try your browser’s site storage controls.",
    });
  }
}
