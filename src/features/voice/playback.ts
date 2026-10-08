import type { Settings } from "../../types";
import { generateVoice, voiceState } from "./naturalVoice";
import { speechChunks } from "./chunks";
export type Playback = {
  owner: string;
  status: "idle" | "preparing" | "speaking" | "error";
  message: string;
};
let state: Playback = { owner: "", status: "idle", message: "" };
let generation = 0;
let audio: HTMLAudioElement | null = null;
let url: string | null = null;
let utterance: SpeechSynthesisUtterance | null = null;
let finishClip: ((played: boolean) => void) | null = null;
const listeners = new Set<() => void>();
export const playbackState = () => state;
export function subscribePlayback(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function emit(next: Playback) {
  state = next;
  listeners.forEach((fn) => fn());
}
function clearAudio() {
  if (audio) {
    audio.pause();
    audio.onended = null;
    audio.onerror = null;
    audio.src = "";
    audio = null;
  }
  if (url) URL.revokeObjectURL(url);
  url = null;
}
export function stopSpeaking() {
  generation++;
  const settle = finishClip;
  finishClip = null;
  settle?.(false);
  clearAudio();
  if (utterance) {
    utterance.onend = null;
    utterance.onerror = null;
    utterance = null;
  }
  window.speechSynthesis?.cancel();
  emit({ owner: "", status: "idle", message: "" });
}
async function playClip(blob: Blob, owner: string, token: number) {
  clearAudio();
  url = URL.createObjectURL(blob);
  audio = new Audio(url);
  const clip = audio;
  const ended = new Promise<boolean>((resolve, reject) => {
    finishClip = resolve;
    clip.onended = () => {
      finishClip = null;
      resolve(true);
    };
    clip.onerror = () => {
      finishClip = null;
      reject(new Error("Audio could not play. Try again."));
    };
  });
  // Attach a rejection handler while play() is still resolving.
  void ended.catch(() => {});
  await clip.play();
  if (token !== generation) return false;
  emit({
    owner,
    status: "speaking",
    message: "Reading aloud. You can stop at any time.",
  });
  return ended;
}
export async function speak(owner: string, text: string, settings: Settings) {
  stopSpeaking();
  const token = generation;
  emit({ owner, status: "preparing", message: "Preparing audio…" });
  try {
    if (settings.voiceEngine === "natural") {
      if (voiceState().status !== "ready")
        throw new Error(
          "Open Settings → Voice and load the natural voice first.",
        );
      for (const chunk of speechChunks(text)) {
        if (token !== generation) return;
        emit({ owner, status: "preparing", message: "Preparing audio…" });
        const blob = await generateVoice(
          chunk,
          settings.voiceName,
          settings.voiceSpeed,
        );
        if (token !== generation) return;
        if (!(await playClip(blob, owner, token))) return;
      }
      if (token === generation) stopSpeaking();
    } else {
      if (!("speechSynthesis" in window))
        throw new Error(
          "This browser has no device voice. Try the natural voice in Settings.",
        );
      const lang = settings.voiceName.startsWith("b") ? "en-GB" : "en-US";
      const voices = speechSynthesis
        .getVoices()
        .filter((v) => v.localService && v.lang.startsWith("en"));
      const voice = voices.find((v) => v.lang === lang) ?? voices[0];
      if (!voice)
        throw new Error(
          "No local English voice is available. Try the natural voice in Settings.",
        );
      utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.rate = settings.voiceSpeed;
      utterance.onend = () => {
        if (token === generation) stopSpeaking();
      };
      utterance.onerror = () => {
        if (token === generation) {
          stopSpeaking();
          emit({
            owner,
            status: "error",
            message: "The device voice could not speak. Try again.",
          });
        }
      };
      speechSynthesis.speak(utterance);
      if (token === generation)
        emit({
          owner,
          status: "speaking",
          message: "Reading aloud. You can stop at any time.",
        });
    }
  } catch (error) {
    if (token !== generation) return;
    stopSpeaking();
    emit({
      owner,
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not read this aloud.",
    });
  }
}
