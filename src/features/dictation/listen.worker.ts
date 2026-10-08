/// <reference lib="webworker" />

/** Local English transcription; only model files are downloaded. */

export type ListenIn =
  { type: "load" } | { type: "transcribe"; id: number; audio: Float32Array };

export type ListenOut =
  | { type: "progress"; loaded: number; total: number }
  | { type: "ready" }
  | { type: "error"; message: string }
  | { type: "text"; id: number; text: string | null };

type Asr = (
  audio: Float32Array,
) => Promise<{ text: string } | { text: string }[]>;

// Hugging Face refuses model downloads referred from workers.dev. Worker scripts can be
// cached without the page's no-referrer header, so every request from here says so itself.
const nativeFetch = self.fetch.bind(self);
self.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
  nativeFetch(input, { ...init, referrerPolicy: "no-referrer" });

export const LISTEN_MODEL = "onnx-community/whisper-tiny.en";
const ctx = self as unknown as DedicatedWorkerGlobalScope;
let asr: Asr | null = null;
let loading: Promise<Asr> | null = null;

const post = (msg: ListenOut) => ctx.postMessage(msg);

function load(): Promise<Asr> {
  if (asr) return Promise.resolve(asr);
  if (loading) return loading;
  const perFile = new Map<string, { loaded: number; total: number }>();
  loading = import("@huggingface/transformers")
    .then(({ pipeline }) =>
      pipeline("automatic-speech-recognition", LISTEN_MODEL, {
        dtype: "q8",
        device: "wasm",
        progress_callback: (info: {
          status: string;
          file?: string;
          loaded?: number;
          total?: number;
        }) => {
          if (
            !info.file ||
            info.status !== "progress" ||
            typeof info.loaded !== "number"
          )
            return;
          perFile.set(info.file, {
            loaded: info.loaded,
            total: typeof info.total === "number" ? info.total : 0,
          });
          let loaded = 0;
          let total = 0;
          for (const f of perFile.values()) {
            loaded += f.loaded;
            total += f.total;
          }
          post({ type: "progress", loaded, total });
        },
      }),
    )
    .then((p) => {
      asr = p as unknown as Asr;
      return asr;
    })
    .catch((err) => {
      loading = null;
      throw err;
    });
  return loading;
}

let queue: Promise<unknown> = Promise.resolve();

ctx.onmessage = (e: MessageEvent<ListenIn>) => {
  const msg = e.data;
  if (msg.type === "load") {
    load().then(
      () => post({ type: "ready" }),
      (err) => post({ type: "error", message: String(err) }),
    );
    return;
  }
  queue = queue.then(async () => {
    try {
      const run = await load();
      const out = await run(msg.audio);
      const text = (Array.isArray(out) ? out[0]?.text : out.text) ?? "";
      post({ type: "text", id: msg.id, text: text.trim() });
    } catch {
      post({ type: "text", id: msg.id, text: null });
    }
  });
};
