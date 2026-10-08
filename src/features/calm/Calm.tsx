import { SpeakButton } from "../voice/SpeakButton";
import type { Settings } from "../../types";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  Leaf,
} from "@phosphor-icons/react";
export function Calm({
  settings,
  reduced,
  onReturn,
}: {
  settings: Settings;
  reduced: boolean;
  onReturn: () => void;
}) {
  const [tool, setTool] = useState<"breathing" | "grounding" | null>(null);
  const [active, setActive] = useState(false);
  const [beat, setBeat] = useState(0);
  const [sense, setSense] = useState(0);
  useEffect(() => {
    if (!active || tool !== "breathing") return;
    const id = setInterval(() => setBeat((b) => b + 1), 1000);
    return () => clearInterval(id);
  }, [active, tool]);
  const inhale = beat % 10 < 4;
  const senses = [
    "Name 5 things you can see",
    "Name 4 things you can feel",
    "Name 3 things you can hear",
    "Name 2 things you can smell",
    "Name 1 thing you can taste",
  ];
  function close() {
    setTool(null);
    setActive(false);
    setBeat(0);
    setSense(0);
  }
  return (
    <section>
      <div className="reassurance">
        <Leaf size={30} />
        <div>
          <strong>There’s no right way to do this.</strong>
          <p>
            Breathe naturally, go at your own pace, and stop whenever you wish.
          </p>
        </div>
      </div>
      {tool === null ? (
        <>
          <div className="tool-grid">
            <article className="tool-card">
              <img
                className="decor"
                src="./art/breathing.png"
                width="240"
                height="170"
                alt=""
              />
              <h2>Breathing exercise</h2>
              <p>Follow a gentle breath cue, or keep your own rhythm.</p>
              <button
                className="primary"
                onClick={() => {
                  setTool("breathing");
                  setActive(true);
                }}
              >
                <Play size={22} />
                Start breathing
              </button>
            </article>
            <article className="tool-card">
              <img
                className="decor"
                src="./art/grounding.png"
                width="240"
                height="170"
                alt=""
              />
              <h2>Five-senses grounding</h2>
              <p>Notice one sense at a time. You can skip any sense.</p>
              <button className="primary" onClick={() => setTool("grounding")}>
                <Play size={22} />
                Start grounding
              </button>
            </article>
          </div>
          <button className="return-row" onClick={onReturn}>
            <ArrowLeft size={24} />
            <span>Return to your task</span>
          </button>
        </>
      ) : (
        <div className="exercise">
          <button className="text-button" onClick={close}>
            <ArrowLeft size={20} />
            Back to the toolkit
          </button>
          {tool === "breathing" ? (
            <>
              <div
                className={`breath-orb ${active && !reduced ? "breathing" : ""}`}
              >
                <span role="status" aria-live="polite">
                  {active ? (inhale ? "Breathe in" : "Breathe out") : "Paused"}
                </span>
              </div>
              <h2>{active ? "At your own pace" : "Take your time"}</h2>
              <p>
                Follow the cue only if it feels comfortable. There’s no need to
                hold your breath.
              </p>
              <div className="button-row center">
                <button
                  className="primary"
                  onClick={() => setActive((a) => !a)}
                >
                  {active ? <Pause size={22} /> : <Play size={22} />}{" "}
                  {active ? "Pause breathing" : "Resume breathing"}
                </button>
                <button onClick={close}>Stop exercise</button>
              </div>
              {reduced && (
                <p className="small muted">
                  Motion is off. The written cue changes at a gentle pace.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="ground-count" aria-hidden="true">
                {5 - sense}
              </div>
              <h2>{senses[sense]}</h2>
              <SpeakButton
                text={
                  senses[sense] + ". You can skip this sense if you prefer."
                }
                settings={settings}
                label="Read this prompt"
              />
              <p>
                You can name them quietly, think of them, or skip this sense.
              </p>
              <div className="button-row center">
                <button
                  onClick={() => setSense((s) => Math.max(0, s - 1))}
                  disabled={sense === 0}
                >
                  Previous sense
                </button>
                <button
                  className="primary"
                  onClick={() =>
                    sense === 4 ? close() : setSense((s) => s + 1)
                  }
                >
                  {sense === 4 ? "Finish grounding" : "Next sense"}
                  <ArrowRight size={22} />
                </button>
              </div>
              <button className="text-button" onClick={close}>
                Stop exercise
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
