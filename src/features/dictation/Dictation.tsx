import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Download, Microphone, Stop } from "@phosphor-icons/react";
import {
  cancelListener,
  listenerState,
  loadListener,
  removeListener,
  subscribeListener,
  transcribeRecording,
} from "./transcription";
import { recordingAvailable, startRecording } from "./recorder";
import { stopSpeaking } from "../voice/playback";
export function Dictation({
  active,
  onText,
  onBusy,
}: {
  active: boolean;
  onText: (text: string) => boolean;
  onBusy: (busy: boolean) => void;
}) {
  const model = useSyncExternalStore(subscribeListener, listenerState);
  const [phase, setPhase] = useState<
    "idle" | "requesting" | "recording" | "transcribing" | "review"
  >("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const controls = useRef<ReturnType<typeof startRecording> | null>(null);
  const generation = useRef(0);
  const review = useRef<HTMLTextAreaElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  function cancel() {
    if (phaseRef.current === "transcribing") cancelListener();
    generation.current++;
    controls.current?.cancel();
    controls.current = null;
    setPhase("idle");
    onBusy(false);
  }
  useEffect(
    () => () => {
      generation.current++;
      controls.current?.cancel();
      if (phaseRef.current === "transcribing") cancelListener();
      onBusy(false);
    },
    [],
  );
  useEffect(() => {
    if (!active) cancel();
  }, [active]);
  useEffect(() => {
    onBusy(
      phase === "requesting" ||
        phase === "recording" ||
        phase === "transcribing",
    );
  }, [phase, onBusy]);
  useEffect(() => {
    if (phase === "review") review.current?.focus();
  }, [phase]);
  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);
  function record() {
    cancel();
    stopSpeaking();
    setError("");
    setTranscript("");
    setSeconds(0);
    setPhase("requesting");
    const token = generation.current;
    controls.current = startRecording({
      onStart: () => {
        if (token === generation.current) setPhase("recording");
      },
      onError: (message) => {
        if (token === generation.current) {
          setError(message);
          setPhase("idle");
        }
      },
      onClip: async (blob) => {
        if (token !== generation.current) return;
        setPhase("transcribing");
        try {
          const text = await transcribeRecording(blob);
          if (token === generation.current) {
            setTranscript(text);
            setPhase("review");
          }
        } catch (e) {
          if (token === generation.current) {
            setError(
              e instanceof Error
                ? e.message
                : "Could not transcribe. Try again.",
            );
            setPhase("idle");
          }
        }
      },
    });
  }
  return (
    <section className="dictation-panel" aria-label="Private microphone input">
      <h3>Say it, then check it</h3>
      <p>
        Record up to 30 seconds in English. Speech is turned into text on your
        device, then you decide what to add.
      </p>
      {!recordingAvailable() ? (
        <p role="alert">
          This browser does not expose microphone recording. Open this app in an
          up-to-date Chrome, Edge or Firefox, or keep typing here.
        </p>
      ) : (
        <>
          {model.status !== "ready" ? (
            <>
              <p className="small muted">
                First, load the speech model (about 40 MB, plus runtime files).
                This downloads from Hugging Face and may use jsDelivr. Your
                microphone stays off and recordings are not uploaded.
              </p>
              <div className="button-row">
                {model.status === "loading" ? (
                  <button onClick={cancelListener}>
                    <Stop size={20} />
                    Cancel setup
                  </button>
                ) : (
                  <button onClick={loadListener}>
                    <Download size={20} />
                    Load private dictation
                  </button>
                )}
              </div>
              {model.status === "loading" && (
                <progress aria-label="Loading private dictation" />
              )}
            </>
          ) : (
            <>
              {phase === "idle" && (
                <button className="primary" onClick={record}>
                  <Microphone size={22} />
                  Start recording
                </button>
              )}
              {phase === "requesting" && (
                <>
                  <p role="status">
                    Waiting for microphone permission. Check your browser’s
                    permission prompt.
                  </p>
                  <button onClick={cancel}>Cancel microphone request</button>
                </>
              )}
              {phase === "recording" && (
                <>
                  <p role="status">
                    Microphone is on. Speak when you’re ready.
                  </p>
                  <p className="small muted" aria-live="off">
                    {seconds} / 30 seconds
                  </p>
                  <div className="button-row">
                    <button
                      className="primary"
                      onClick={() => controls.current?.stop()}
                    >
                      <Stop size={22} />
                      Stop and transcribe
                    </button>
                    <button onClick={cancel}>Discard recording</button>
                  </div>
                </>
              )}
              {phase === "transcribing" && (
                <>
                  <p role="status">
                    Microphone is off. Turning your recording into text…
                  </p>
                  <button onClick={cancel}>Cancel transcription</button>
                </>
              )}
              {phase === "review" && (
                <>
                  <label>
                    Check what was heard
                    <textarea
                      ref={review}
                      value={transcript}
                      maxLength={6000}
                      onChange={(e) => setTranscript(e.target.value)}
                    />
                  </label>
                  <p className="small muted">
                    Speech recognition can make mistakes. Edit this before
                    adding it to your note.
                  </p>
                  <div className="button-row">
                    <button
                      className="primary"
                      disabled={!transcript.trim()}
                      onClick={() => {
                        if (!onText(transcript.trim())) {
                          setError(
                            "Your note is full. Shorten the note or transcript before adding it; your transcript is still here.",
                          );
                          return;
                        }
                        setError("");
                        setTranscript("");
                        setPhase("idle");
                      }}
                    >
                      Add to note
                    </button>
                    <button onClick={record}>Record again</button>
                    <button
                      onClick={() => {
                        setTranscript("");
                        cancel();
                      }}
                    >
                      Discard transcript
                    </button>
                  </div>
                </>
              )}
            </>
          )}
          <p className="small muted" role="status">
            {phase === "idle" ? model.message : ""}
          </p>
          <button
            className="text-button"
            disabled={phase !== "idle" || model.status === "loading"}
            onClick={() => void removeListener()}
          >
            Remove saved dictation model
          </button>
        </>
      )}
      <p className="error" role="alert">
        {error}
      </p>
    </section>
  );
}
