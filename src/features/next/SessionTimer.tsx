import { Select } from "../../components/Select";
import {
  Coffee,
  Leaf,
  Play,
  Pause,
  ArrowCounterClockwise,
  Plus,
} from "@phosphor-icons/react";
import type { FocusSession } from "./useFocusSession";
import { rhythmLabels, type Rhythm } from "./rhythm";
export function SessionTimer({
  session,
  hasTask,
}: {
  session: FocusSession;
  hasTask: boolean;
}) {
  const time = `${Math.floor(session.remaining / 60)
    .toString()
    .padStart(2, "0")}:${(session.remaining % 60).toString().padStart(2, "0")}`;
  const resting = session.phase === "break";
  return (
    <>
      <div className="session-toolbar">
        <label className="rhythm-choice">
          Your rhythm
          <Select
            aria-label="Focus rhythm"
            value={session.rhythm}
            disabled={session.running}
            onChange={(e) => session.chooseRhythm(e.target.value as Rhythm)}
          >
            {Object.entries(rhythmLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
        <details className="rhythm-details">
          <summary>About this rhythm</summary>
          <p className="small muted">
            {session.rhythm === "flexible"
              ? "Use your task’s estimate. Add time whenever you need."
              : session.rhythm === "gentle"
                ? "10 minutes of focus, then a 3-minute pause. Start each part when you’re ready."
                : "25 minutes of focus, then 5 minutes of rest. A 15-minute break after four rounds."}
          </p>
        </details>
      </div>
      {session.rhythm !== "flexible" && (
        <div className="session-track" aria-label="Session phase">
          <span className={!resting ? "current" : ""}>
            <Leaf size={18} />
            Focus
          </span>
          <span aria-hidden="true">→</span>
          <span className={resting ? "current" : ""}>
            <Coffee size={18} />
            Rest
          </span>
          <span className="small muted">
            {session.rounds > 0
              ? `${session.rounds} focus ${session.rounds === 1 ? "round" : "rounds"} finished`
              : "At your own pace"}
          </span>
        </div>
      )}
      <div
        className={`timer ${resting ? "rest-timer" : ""}`}
        role="timer"
        aria-label={`${Math.floor(session.remaining / 60)} minutes ${session.remaining % 60} seconds remaining`}
        aria-live="off"
      >
        <svg className="timer-ring" viewBox="0 0 280 280" aria-hidden="true">
          <circle
            cx="140"
            cy="140"
            r="130"
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth="10"
          />
          <circle
            cx="140"
            cy="140"
            r="130"
            fill="none"
            stroke="var(--ring)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 130}
            strokeDashoffset={
              2 * Math.PI * 130 * (1 - session.remaining / session.total)
            }
          />
        </svg>
        <div className="timer-copy">
          <div className="time">{time}</div>
          <div className="timer-label">
            {resting
              ? "A little breathing room"
              : session.running
                ? "One small step"
                : "Your focus time"}
          </div>
        </div>
      </div>
      {resting && (
        <div className="rest-copy">
          <h2>Room to rest</h2>
          <p>
            Look away from the screen. Stretch, get some water, or simply sit.
            Your task can wait.
          </p>
        </div>
      )}
      {session.finished && session.rhythm !== "flexible" && (
        <div className="phase-complete" role="status">
          <h3>
            {resting
              ? "Come back when you’re ready"
              : "You can take a pause now"}
          </h3>
          <p>
            {resting
              ? "Your next focus round starts only when you choose."
              : `Your ${session.breakMinutes}-minute break is ready. You can keep going if that feels better.`}
          </p>
          <button
            className="primary"
            onClick={() => session.nextPhase(resting ? "focus" : "break")}
          >
            {resting
              ? "Prepare next focus round"
              : `Take a ${session.breakMinutes}-minute break`}
          </button>
        </div>
      )}
      <div className="session-controls">
        <button
          className="primary"
          onClick={session.toggle}
          disabled={
            session.remaining === 0 ||
            (!hasTask && !resting && !session.running)
          }
        >
          {session.running ? <Pause size={24} /> : <Play size={24} />}{" "}
          {session.running
            ? resting
              ? "Pause break"
              : "Pause focus"
            : resting
              ? "Start break"
              : "Start focus"}
        </button>
        <button className="text-button" onClick={session.add}>
          <Plus size={20} />
          Add 2 minutes
        </button>
        <button className="text-button" onClick={session.reset}>
          <ArrowCounterClockwise size={20} />
          Reset timer
        </button>
        {resting && (
          <button
            className="text-button"
            onClick={() => session.nextPhase("focus")}
          >
            Return to focus
          </button>
        )}
      </div>
    </>
  );
}
