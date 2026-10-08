import { microphoneError } from "./transcription";
export function recordingAvailable() {
  return (
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}
/** Cancelling during a permission prompt also closes any stream that arrives later. */
export function startRecording(callbacks: {
  onStart: () => void;
  onClip: (blob: Blob) => void;
  onError: (message: string) => void;
}) {
  let cancelled = false;
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const chunks: Blob[] = [];
  const release = () => {
    clearTimeout(timeout);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };
  function cancel() {
    cancelled = true;
    clearTimeout(timeout);
    if (recorder) {
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.ondataavailable = null;
      if (recorder.state !== "inactive") recorder.stop();
    }
    release();
  }
  function stop() {
    if (recorder?.state === "recording") recorder.stop();
    release();
  }
  async function begin() {
    try {
      if (!recordingAvailable()) throw new Error("unsupported");
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      if (cancelled) {
        release();
        return;
      }
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onerror = () => {
        cancel();
        callbacks.onError(
          "The recording stopped unexpectedly. Please try again.",
        );
      };
      recorder.onstop = () => {
        release();
        if (!cancelled)
          callbacks.onClip(
            new Blob(chunks, { type: recorder?.mimeType || "audio/webm" }),
          );
      };
      recorder.start();
      callbacks.onStart();
      timeout = setTimeout(stop, 30_000);
    } catch (error) {
      release();
      if (!cancelled) callbacks.onError(microphoneError(error));
    }
  }
  void begin();
  return { stop, cancel };
}
