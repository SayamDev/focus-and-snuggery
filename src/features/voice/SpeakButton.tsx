import { useEffect, useId, useSyncExternalStore } from "react";
import { SpeakerHigh, Stop } from "@phosphor-icons/react";
import type { Settings } from "../../types";
import {
  playbackState,
  speak,
  stopSpeaking,
  subscribePlayback,
} from "./playback";
export function SpeakButton({
  text,
  settings,
  label = "Read aloud",
}: {
  text: string;
  settings: Settings;
  label?: string;
}) {
  const id = useId();
  const playback = useSyncExternalStore(subscribePlayback, playbackState);
  const mine = playback.owner === id;
  const active = mine && ["preparing", "speaking"].includes(playback.status);
  useEffect(
    () => () => {
      if (playbackState().owner === id) stopSpeaking();
    },
    [id, text],
  );
  return (
    <div className="read-aloud">
      <button
        type="button"
        className="text-button"
        onClick={() =>
          active ? stopSpeaking() : void speak(id, text, settings)
        }
        aria-pressed={active}
      >
        {active ? <Stop size={20} /> : <SpeakerHigh size={20} />}
        {active ? "Stop reading" : label}
      </button>
      {mine && (
        <p
          className={
            playback.status === "error" ? "small error" : "small muted"
          }
          role="status"
        >
          {playback.message}
        </p>
      )}
    </div>
  );
}
