import { useEffect, useRef, useState } from "react";
import {
  Check,
  Play,
  Pause,
  Clock,
  ArrowsIn,
  Lifebuoy,
  SpeakerHigh,
  Plus,
  ArrowCounterClockwise,
  NotePencil,
  Plant,
} from "@phosphor-icons/react";
import { useFocusSession, type FocusSession } from "./useFocusSession";
import { SessionTimer } from "./SessionTimer";
import { ParkThought } from "./ParkThought";
import { SpeakButton } from "../voice/SpeakButton";
import { splitTasks, toneCopy } from "../../services/ai";
import { isCrisis, newTasks } from "../../services/tasks";
import {
  stepSchema,
  stepsSchema,
  type AppData,
  type Step,
  type Task,
} from "../../types";
import { CrisisSupport } from "../../components/CrisisSupport";
type Props = {
  task?: Task;
  data: AppData;
  update: (fn: (d: AppData) => AppData, message?: string) => void;
  onDump: () => void;
  onNotice: (s: string) => void;
  aiEnabled: boolean;
  onRunning: (value: boolean) => void;
  active: boolean;
};
export function Next(props: Props) {
  const session = useFocusSession(
    props.task,
    props.data.settings,
    props.onNotice,
  );
  useEffect(() => {
    props.onRunning(session.running);
    return () => props.onRunning(false);
  }, [session.running, props.onRunning]);
  if (!props.task && session.rhythm === "flexible")
    return (
      <div className="empty-focus">
        <div className="empty-symbol">
          <Plant size={68} weight="light" />
        </div>
        <h2>A little room to begin</h2>
        <p>
          You don’t need a whole plan.
          <br />
          Start with whatever is on your mind.
        </p>
        <button className="primary" onClick={props.onDump}>
          <NotePencil size={24} />
          Make a brain dump
        </button>
        <p className="small muted">Private, on your device. At your pace.</p>
      </div>
    );
  return (
    <>
      <section className="focus-panel" aria-label="Focus session">
        {props.task && (
          <div className="task">
            <div className="task-icon">
              <Check size={34} />
            </div>
            <div>
              <h2>{props.task.title}</h2>
              <p>
                {props.task.effort.charAt(0).toUpperCase() +
                  props.task.effort.slice(1)}{" "}
                effort <span aria-hidden="true">·</span> About{" "}
                {props.task.minutes} minutes
              </p>
            </div>
          </div>
        )}
        <SessionTimer session={session} hasTask={!!props.task} />
        {props.task ? (
          <TaskFocus
            {...props}
            task={props.task}
            session={session}
            key={props.task.id}
          />
        ) : (
          <div className="rest-copy">
            <h2>A little room to begin</h2>
            <p>
              Your round is still here. Add another task whenever you’re ready.
            </p>
            <button onClick={props.onDump}>Make a brain dump</button>
          </div>
        )}
      </section>
      <ParkThought data={props.data} update={props.update} />
    </>
  );
}
function TaskFocus({
  task,
  data,
  update,
  onNotice,
  aiEnabled,
  onRunning,
  active,
  session: timer,
}: Props & { task: Task; session: FocusSession }) {
  const smallerHeading = useRef<HTMLHeadingElement>(null);
  const stuckHeading = useRef<HTMLHeadingElement>(null);
  const titleField = useRef<HTMLInputElement>(null);
  const minutesField = useRef<HTMLInputElement>(null);
  const [stuck, setStuck] = useState(false);
  const [smaller, setSmaller] = useState<Step[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [crisis, setCrisis] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [minutes, setMinutes] = useState(task.minutes);
  useEffect(() => {
    if (active && smaller) smallerHeading.current?.focus();
  }, [!!smaller, active]);
  useEffect(() => {
    if (active && stuck) stuckHeading.current?.focus();
  }, [stuck, active]);
  function done() {
    if (timer.rhythm === "flexible") timer.reset();
    update(
      (d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === task.id
            ? { ...t, status: "done", completedAt: Date.now() }
            : t,
        ),
      }),
      "Task marked done.",
    );
  }
  function later() {
    if (timer.rhythm === "flexible") timer.reset();
    update(
      (d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === task.id ? { ...t, status: "later" } : t,
        ),
      }),
      "Moved to later. It will be here when you’re ready.",
    );
  }
  async function shrink() {
    setBusy(true);
    setError("");
    try {
      setSmaller(await splitTasks(task.title, { ai: aiEnabled, small: true }));
    } catch (e) {
      if (e instanceof Error && e.message === "crisis") setCrisis(true);
      else
        setError(
          "Could not make smaller steps. You can edit this task instead.",
        );
    } finally {
      setBusy(false);
    }
  }
  function saveSmaller() {
    const parsed = stepsSchema.safeParse(smaller);
    if (!parsed.success) {
      setError("Each step needs a title and a time between 2 and 15 minutes.");
      return;
    }
    if (parsed.data.some((s) => isCrisis(s.title))) {
      setCrisis(true);
      return;
    }
    if (timer.rhythm === "flexible") timer.reset();
    update(
      (d) => ({
        ...d,
        tasks: [
          ...d.tasks.filter((t) => t.id !== task.id),
          ...newTasks(parsed.data, task.order),
        ],
      }),
      "Replaced with smaller steps.",
    );
    setSmaller(null);
  }
  function editTask() {
    if (
      !stepSchema.safeParse({
        title: title.trim(),
        minutes,
        effort: task.effort,
      }).success
    ) {
      setError(
        "Use a title of at least three characters and a whole number of minutes from 2 to 15.",
      );
      if (title.trim().length < 3) titleField.current?.focus();
      else minutesField.current?.focus();
      return;
    }
    if (isCrisis(title)) {
      setCrisis(true);
      return;
    }
    if (timer.rhythm === "flexible") timer.reset();
    update(
      (d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === task.id ? { ...t, title: title.trim(), minutes } : t,
        ),
      }),
      "Task updated.",
    );
    setEditing(false);
  }
  if (crisis)
    return (
      <CrisisSupport
        country={data.settings.country}
        onCountry={(country) =>
          update((d) => ({ ...d, settings: { ...d.settings, country } }))
        }
        onClear={() => {
          setCrisis(false);
          setSmaller(null);
          setTitle(task.title);
          setEditing(false);
        }}
      />
    );
  return (
    <div className={timer.phase === "break" ? "task-during-break" : ""}>
      <section aria-label="Your current task">
        <div className="actions">
          <button onClick={done}>
            <Check size={24} />
            Done
          </button>
          <button onClick={shrink} disabled={busy || timer.running}>
            <ArrowsIn size={24} />
            {busy ? "Making steps…" : "Make it smaller"}
          </button>
          <button onClick={later}>
            <Clock size={24} />
            Not now
          </button>
          <button onClick={() => setStuck((s) => !s)} aria-expanded={stuck}>
            <Lifebuoy size={24} />
            I’m stuck
          </button>
        </div>
      </section>
      <div className="timer-options">
        <button
          className="text-button"
          onClick={() => {
            setEditing((e) => !e);
            setTitle(task.title);
            setMinutes(task.minutes);
            setError("");
          }}
          disabled={timer.running}
        >
          Edit task
        </button>
        <SpeakButton
          text={task.title}
          settings={data.settings}
          label="Read task aloud"
        />
      </div>
      {timer.remaining === 0 && timer.rhythm === "flexible" && (
        <p className="inline-note">
          Time is up. You can add more time, mark the task done, or leave it for
          later.
        </p>
      )}
      {stuck && (
        <div className="inline-note">
          <h3 tabIndex={-1} ref={stuckHeading}>
            Just the first action
          </h3>
          <p>
            {toneCopy(
              data.settings.tone,
              "Gather the one thing you need to begin.",
              "You can start by gathering just one thing you need. That is enough for now.",
              "Gather one thing you need.",
            )}
          </p>
          <button onClick={() => setStuck(false)}>Keep this task</button>
        </div>
      )}
      {editing && (
        <div className="panel">
          <h3>Edit this task</h3>
          <label>
            Task title
            <input
              ref={titleField}
              value={title}
              maxLength={180}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Estimated minutes
            <input
              ref={minutesField}
              type="number"
              min={2}
              max={15}
              step={1}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
          <div className="button-row">
            <button onClick={editTask} className="primary">
              Save task
            </button>
            <button onClick={() => setEditing(false)}>Cancel edit</button>
          </div>
        </div>
      )}
      {smaller && (
        <section className="panel">
          <h3 tabIndex={-1} ref={smallerHeading}>
            Try these smaller steps
          </h3>
          <p>Review these before replacing your current task.</p>
          {smaller.map((s, i) => (
            <label key={i}>
              Smaller step {i + 1}
              <input
                value={s.title}
                maxLength={180}
                onChange={(e) =>
                  setSmaller(
                    (prev) =>
                      prev?.map((t, j) =>
                        i === j ? { ...t, title: e.target.value } : t,
                      ) ?? null,
                  )
                }
              />
              <span className="small muted">About {s.minutes} minutes</span>
            </label>
          ))}
          <div className="button-row">
            <button className="primary" onClick={saveSmaller}>
              Use smaller steps
            </button>
            <button onClick={() => setSmaller(null)}>Keep original task</button>
          </div>
        </section>
      )}
      <p className="error" role="alert">
        {error}
      </p>
    </div>
  );
}
