import { expect, it, vi } from "vitest";
import { removeNaturalVoice } from "./naturalVoice";
it("removes model and voice-style caches while leaving unrelated cached models intact", async () => {
  const model = new Request(
    "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/model.onnx",
  );
  const other = new Request("https://huggingface.co/other-model/model.onnx");
  const remove = vi.fn();
  const removeCache = vi.fn();
  vi.stubGlobal("caches", {
    keys: async () => ["transformers-cache", "kokoro-voices", "other-cache"],
    open: async () => ({ keys: async () => [model, other], delete: remove }),
    delete: removeCache,
  });
  await removeNaturalVoice();
  expect(remove).toHaveBeenCalledExactlyOnceWith(model);
  expect(removeCache).toHaveBeenCalledExactlyOnceWith("kokoro-voices");
  vi.unstubAllGlobals();
});
