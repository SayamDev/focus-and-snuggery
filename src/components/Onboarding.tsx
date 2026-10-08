import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  ArrowRight,
  Download,
  Plant,
  SpeakerHigh,
  Stop,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { Settings } from "../types";
import {
  voiceState,
  subscribeVoice,
  loadNaturalVoice,
  cancelVoiceLoad,
} from "../features/voice/naturalVoice";
import { SpeakButton } from "../features/voice/SpeakButton";
import { stopSpeaking } from "../features/voice/playback";

export function Onboarding({
  settings,
  onChange,
  onFinish,
}: {
  settings: Settings;
  onChange: (value: Partial<Settings>) => void;
  onFinish: (startWithDump?: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const voice = useSyncExternalStore(subscribeVoice, voiceState);
  useEffect(() => {
    const el = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = "hidden";
    title.current?.focus();
    return () => {
      el.close();
      document.body.style.overflow = overflow;
      stopSpeaking();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="welcome-dialog"
      ref={dialog}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const el = dialog.current!;
        const items = Array.from(
          el.querySelectorAll<HTMLElement>(
            "button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, a[href]",
          ),
        ).filter((node) => node.getClientRects().length > 0);
        const first = items[0],
          last = items.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === title.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      aria-labelledby="welcome-title"
      aria-describedby="welcome-description"
      onCancel={(e) => {
        e.preventDefault();
        onFinish();
      }}
    >
      <div className="welcome-layout">
        <aside
          className="welcome-art"
          style={
            {
              backgroundImage: `url(${import.meta.env.BASE_URL}art/welcome-corner.webp)`,
            } as import("react").CSSProperties
          }
          aria-label="Focus & Snuggery"
        >
          <div className="brand">
            <Plant size={30} weight="fill" />
            <span>Focus &amp; Snuggery</span>
          </div>
          <div className="welcome-art-copy">
            <h2>
              A little room
              <br />
              to begin.
            </h2>
            <p>
              Your thoughts. Your pace.
              <br />A space that stays yours.
            </p>
          </div>
        </aside>
        <div className="welcome-content">
          <div className="welcome-top">
            <button className="text-button" onClick={() => onFinish()}>
              Skip setup
            </button>
          </div>
          <h1 id="welcome-title" ref={title} tabIndex={-1}>
            Welcome.
            <br />
            Make yourself at home.
          </h1>
          <p id="welcome-description" className="welcome-lead">
            A calmer place for your thoughts, one small step at a time.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onFinish(true);
            }}
          >
            <label htmlFor="welcome-name">
              What should we call you?{" "}
              <span className="optional">Optional</span>
            </label>
            <input
              id="welcome-name"
              name="given-name"
              autoComplete="given-name"
              placeholder="Your first name"
              maxLength={48}
              value={settings.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
              aria-describedby="name-privacy"
            />
            <p id="name-privacy" className="small muted name-note">
              Saved only in this browser. No account needed.
            </p>
            <section
              className="welcome-voice"
              aria-labelledby="welcome-voice-title"
            >
              <SpeakerHigh size={28} aria-hidden="true" />
              <div>
                <h2 id="welcome-voice-title">A voice at your pace</h2>
                <p>
                  Hear your next step in a natural voice. Optional, and
                  generated on your device.
                </p>
                <div className="button-row">
                  {voice.status === "loading" ? (
                    <button type="button" onClick={cancelVoiceLoad}>
                      <Stop size={20} />
                      Cancel download
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={voice.status === "ready"}
                      onClick={() => {
                        onChange({ voiceEngine: "natural" });
                        loadNaturalVoice();
                      }}
                    >
                      <Download size={20} />
                      {voice.status === "ready"
                        ? "Natural voice ready"
                        : "Load natural voice"}
                    </button>
                  )}
                  {voice.status === "ready" && (
                    <SpeakButton
                      text="Welcome to Focus and Snuggery. One small step is enough. Take this at your own pace."
                      settings={{ ...settings, voiceEngine: "natural" }}
                      label="Try natural voice"
                    />
                  )}
                </div>
                {voice.status === "loading" && (
                  <progress aria-label="Preparing natural voice" />
                )}
                <p className="small muted voice-size">
                  About 115 MB · No microphone needed
                </p>
                <details>
                  <summary>Download and privacy</summary>
                  <p className="small muted">
                    Downloads model and voice files from Hugging Face, and
                    runtime files from this app or jsDelivr. Your words stay on
                    your device. Cached files can be reused but may be cleared
                    by your browser. You can cancel or remove the download in
                    Settings.
                  </p>
                </details>
                <p
                  className={
                    voice.status === "error" ? "error small" : "small muted"
                  }
                  role="status"
                >
                  {voice.message}
                </p>
              </div>
            </section>
            <p className="small muted welcome-tip">
              You can change your name, voice and comfort settings anytime.
            </p>
            <div className="welcome-actions">
              <button type="submit" className="primary">
                Start with a brain dump
                <ArrowRight size={21} />
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => onFinish()}
              >
                Explore the app
              </button>
            </div>
          </form>
          <p className="welcome-privacy small muted">
            <ShieldCheck size={17} />
            No accounts. No tracking. No pressure.
          </p>
        </div>
      </div>
    </dialog>
  );
}
