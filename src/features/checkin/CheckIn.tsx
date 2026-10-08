import { useState } from "react";
import {
  Smiley,
  SmileyMeh,
  SmileySad,
  SpeakerHigh,
  Sun,
  Shapes,
  Check,
  Leaf,
} from "@phosphor-icons/react";
import type { AppData, Checkin } from "../../types";
export function CheckIn({
  data,
  update,
  onCalm,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData, message?: string) => void;
  onCalm: () => void;
}) {
  const [mood, setMood] = useState<Checkin["mood"] | null>(null);
  const [sensory, setSensory] = useState<Checkin["sensory"]>(null);
  const [error, setError] = useState("");
  const moods = [
    {
      value: "low",
      title: "Low",
      description: "Tired or overwhelmed",
      Icon: SmileySad,
    },
    {
      value: "okay",
      title: "Okay",
      description: "Somewhere in the middle",
      Icon: SmileyMeh,
    },
    {
      value: "good",
      title: "Good",
      description: "Comfortable or steady",
      Icon: Smiley,
    },
  ] as const;
  const senses = [
    { value: "loud", title: "Too loud", Icon: SpeakerHigh },
    { value: "bright", title: "Too bright", Icon: Sun },
    { value: "busy", title: "Too busy", Icon: Shapes },
    { value: "fine", title: "Fine", Icon: Check },
  ] as const;
  function save() {
    if (!mood) {
      setError("Choose the feeling that is closest to yours.");
      return;
    }
    update(
      (d) => ({
        ...d,
        checkins: [
          ...d.checkins,
          { id: crypto.randomUUID(), mood, sensory, createdAt: Date.now() },
        ],
      }),
      "Check-in saved on this device.",
    );
    setError("");
    setMood(null);
    setSensory(null);
  }
  const days = new Set(
    data.checkins.map((c) => new Date(c.createdAt).toDateString()),
  ).size;
  const done = data.tasks.filter((t) => t.status === "done" && t.completedAt);
  const observed = done.filter((t) => {
    const earlier = data.checkins
      .filter(
        (c) =>
          c.createdAt < t.completedAt! &&
          t.completedAt! - c.createdAt < 4 * 3600000,
      )
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    return earlier?.mood === "good";
  }).length;
  return (
    <section>
      <div
        className="mood-options"
        role="group"
        aria-label="How are you feeling?"
      >
        {moods.map(({ value, title, description, Icon }) => (
          <button
            key={value}
            className={`mood ${mood === value ? "selected" : ""}`}
            onClick={() => setMood(value)}
            aria-pressed={mood === value}
            aria-label={title}
          >
            <span className="face">
              <Icon size={54} weight="light" />
            </span>
            <strong>{title}</strong>
            <span className="muted">{description}</span>
          </button>
        ))}
      </div>
      <div className="checkin-bottom">
        <div className="panel">
          <h2>How does your space feel?</h2>
          <p className="muted">Optional. Choose one, or leave this blank.</p>
          <div
            className="sensory-options"
            role="group"
            aria-label="Sensory check"
          >
            {senses.map(({ value, title, Icon }) => (
              <button
                key={value}
                className={sensory === value ? "selected" : ""}
                aria-pressed={sensory === value}
                onClick={() => setSensory((s) => (s === value ? null : value))}
              >
                <Icon size={24} />
                {title}
              </button>
            ))}
          </div>
        </div>
        <div className="calm-callout">
          <Leaf size={30} />
          <h2>A little space to pause</h2>
          <p>You can open the calming toolkit at any time.</p>
          <button className="primary" onClick={onCalm}>
            Open calming toolkit
          </button>
        </div>
      </div>
      <div className="button-row">
        <button className="primary" onClick={save}>
          <Check size={22} />
          Save check-in
        </button>
      </div>
      <p role="alert" className="error">
        {error}
      </p>
      <div className="insight">
        <h3>Only for you</h3>
        {days >= 5 && done.length >= 5 ? (
          <p>
            You marked {done.length} tasks done. Of those, {observed} were
            within four hours of a “Good” check-in. This is a description of
            your records, not a reason or a prediction.
          </p>
        ) : (
          <p className="muted">
            After check-ins on five days and five completed tasks, you’ll see a
            simple observation from your own records.
          </p>
        )}
        <p className="small muted">
          No streaks. No score. Your check-ins stay on this device.
        </p>
      </div>
    </section>
  );
}
