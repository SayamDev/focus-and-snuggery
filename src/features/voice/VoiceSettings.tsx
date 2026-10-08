import { Select } from "../../components/Select";
import { useSyncExternalStore } from "react";
import { SpeakerHigh, Download, Stop, Trash } from "@phosphor-icons/react";
import type { Settings } from "../../types";
import {
  voiceState,
  subscribeVoice,
  loadNaturalVoice,
  cancelVoiceLoad,
  removeNaturalVoice,
} from "./naturalVoice";
import { stopSpeaking } from "./playback";
import { SpeakButton } from "./SpeakButton";
export function VoiceSettings({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const state = useSyncExternalStore(subscribeVoice, voiceState);
  return (
    <section className="panel voice-settings" aria-labelledby="voice-heading">
      <div className="section-title">
        <SpeakerHigh size={28} />
        <h2 id="voice-heading">A voice at your pace</h2>
      </div>
      <p>
        Listen to your next step or a grounding prompt. Nothing speaks until you
        press Read aloud.
      </p>
      <div className="voice-fields">
        <label>
          Read-aloud voice
          <Select
            value={settings.voiceEngine}
            onChange={(e) => {
              stopSpeaking();
              onChange({
                voiceEngine: e.target.value as Settings["voiceEngine"],
              });
            }}
          >
            <option value="device">Device voice · no download</option>
            <option value="natural">Natural AI voice · on this device</option>
          </Select>
        </label>
        <label>
          Voice style
          <Select
            value={settings.voiceName}
            onChange={(e) => {
              stopSpeaking();
              onChange({ voiceName: e.target.value as Settings["voiceName"] });
            }}
          >
            <option value="bf_emma">Emma · British English</option>
            <option value="bm_george">George · British English</option>
            <option value="af_heart">Heart · American English</option>
          </Select>
        </label>
        <label>
          Reading pace
          <Select
            value={settings.voiceSpeed}
            onChange={(e) => {
              stopSpeaking();
              onChange({ voiceSpeed: Number(e.target.value) });
            }}
          >
            <option value="0.8">Slower</option>
            <option value="1">Natural</option>
            <option value="1.15">A little faster</option>
          </Select>
        </label>
      </div>
      {settings.voiceEngine === "device" ? (
        <p className="small muted">
          Uses an installed English voice. The exact sound depends on your
          device.
        </p>
      ) : (
        <div className="voice-download">
          <p>
            A natural AI voice, generated on your device. About 115 MB to set
            up, including the model, voices and runtime. Your words stay on this
            device.
          </p>
          <details className="voice-details">
            <summary>Download and privacy details</summary>
            <p className="small muted">
              Model and voice files download from Hugging Face when you press
              Load natural voice. Runtime files come from this app or jsDelivr.
              All three voice styles are prepared together. Browser caching
              helps future loads; files may need downloading again if storage is
              cleared.
            </p>
          </details>
          <div className="button-row">
            {state.status === "loading" ? (
              <button onClick={cancelVoiceLoad}>
                <Stop size={20} />
                Cancel voice download
              </button>
            ) : (
              <button
                className="primary"
                disabled={state.status === "ready"}
                onClick={loadNaturalVoice}
              >
                <Download size={20} />
                {state.status === "ready"
                  ? "Natural voice ready"
                  : "Load natural voice"}
              </button>
            )}
            <button
              onClick={() => {
                stopSpeaking();
                void removeNaturalVoice();
              }}
              disabled={state.status === "loading"}
            >
              <Trash size={20} />
              Remove saved voice
            </button>
          </div>
          {state.status === "loading" && (
            <progress aria-label="Preparing natural voice" />
          )}
          <p
            className={state.status === "error" ? "error" : "small muted"}
            role="status"
          >
            {state.message}
          </p>
        </div>
      )}
      <p className="voice-sample">
        “One small step is enough. Take this at your own pace.”
      </p>
      <SpeakButton
        text="One small step is enough. Take this at your own pace."
        settings={settings}
        label="Try this voice"
      />
    </section>
  );
}
