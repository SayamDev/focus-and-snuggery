interface RecognitionEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export function voiceAvailable() {
  const w = window as RecognitionWindow;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}
export function startVoice(
  onText: (text: string) => void,
  onError: (message: string) => void,
  onEnd: () => void,
): () => void {
  const w = window as RecognitionWindow;
  const Constructor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Constructor) {
    onError(
      "Voice input is not available in this browser. You can type instead.",
    );
    return () => {};
  }
  const recognition = new Constructor();
  recognition.lang = navigator.language;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = (e) =>
    onText(
      Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" "),
    );
  recognition.onerror = () =>
    onError(
      "Voice input could not start. Check microphone permission or type instead.",
    );
  recognition.onend = onEnd;
  try {
    recognition.start();
  } catch {
    onError("Voice input could not start. You can type instead.");
    onEnd();
  }
  return () => {
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.stop();
  };
}
