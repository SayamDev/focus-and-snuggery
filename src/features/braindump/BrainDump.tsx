import { Select } from "../../components/Select";
import { Dictation } from "../dictation/Dictation";
import { SpeakButton } from "../voice/SpeakButton";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Microphone,
  Trash,
  Check,
  Plus,
  Stop,
  ArrowLeft,
} from "@phosphor-icons/react";
import { splitTasks } from "../../services/ai";
import { analyseDump, isCrisis, newTasks } from "../../services/tasks";
import { stepsSchema, type AppData, type Step } from "../../types";
import { CrisisSupport } from "../../components/CrisisSupport";
export function BrainDump({
  data,
  update,
  onSaved,
  aiEnabled,
  active,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData, message?: string) => void;
  onSaved: () => void;
  aiEnabled: boolean;
  active: boolean;
}) {
  const [text, setText] = useState("");
  const [reviewUndo, setReviewUndo] = useState<Step[] | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [crisis, setCrisis] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [unclear, setUnclear] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const review = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (active && steps) review.current?.focus();
    if (!active) setListening(false);
  }, [active, !!steps]);
  async function split() {
    setError("");
    if (!text.trim()) {
      setError("Write a thought first. A few words is enough.");
      textarea.current?.focus();
      return;
    }
    if (isCrisis(text)) {
      setCrisis(true);
      setSteps(null);
      return;
    }
    setBusy(true);
    try {
      const local = analyseDump(text);
      let usedLocal = !aiEnabled;
      const result = await splitTasks(text, {
        ai: aiEnabled,
        onFallback: () => {
          usedLocal = true;
        },
      });
      setUnclear(usedLocal ? local.unclear : []);
      setSteps(result);
    } catch (e) {
      if (e instanceof Error && e.message === "crisis") setCrisis(true);
      else setError("Could not make steps. Try again or shorten your note.");
    } finally {
      setBusy(false);
    }
  }
  function edit(index: number, value: Partial<Step>) {
    setReviewUndo(steps);
    setSteps(
      (prev) =>
        prev?.map((s, i) => (i === index ? { ...s, ...value } : s)) ?? null,
    );
  }
  function move(index: number, delta: number) {
    setReviewUndo(steps);
    setSteps((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }
  function save() {
    const parsed = stepsSchema.safeParse(steps);
    if (!parsed.success) {
      setError("Give every step a title, 2–15 minutes, and an effort level.");
      document.querySelector<HTMLInputElement>("[data-step-title]")?.focus();
      return;
    }
    if (parsed.data.some((s) => isCrisis(s.title))) {
      setCrisis(true);
      setSteps(null);
      return;
    }
    update(
      (d) => ({
        ...d,
        tasks: [
          ...d.tasks,
          ...newTasks(
            parsed.data,
            Math.max(-1, ...d.tasks.map((t) => t.order)) + 1,
          ),
        ],
      }),
      "Steps saved on this device.",
    );
    setSteps(null);
    setText(unclear.join("\n"));
    setUnclear([]);
    onSaved();
  }
  if (crisis)
    return (
      <CrisisSupport
        country={data.settings.country}
        onCountry={(country) =>
          update((d) => ({ ...d, settings: { ...d.settings, country } }))
        }
        onClear={() => {
          setText("");
          setCrisis(false);
          setSteps(null);
        }}
      />
    );
  return (
    <section aria-label="Brain dump workspace">
      <p className="dump-flow" aria-label="Brain dump progress">
        <strong>
          {steps === null ? "1. Write a note" : "2. Review your steps"}
        </strong>
        <span>
          {steps === null
            ? "Then review small steps and choose one to begin."
            : "Save the steps you want. Your next task will open."}
        </span>
      </p>
      {steps === null ? (
        <>
          <div className="starter-prompts" aria-label="Ideas to get started">
            <span className="small muted">A few words is enough. Try:</span>
            {[
              ["Tidy a space", "clean my room"],
              ["Reply to someone", "reply to an email"],
              ["Make a meal", "figure out dinner"],
            ].map(([label, prompt]) => (
              <button
                key={label}
                className="text-button"
                disabled={busy || listening}
                onClick={() => {
                  setText((previous) =>
                    previous ? `${previous} and ${prompt}` : prompt,
                  );
                  textarea.current?.focus();
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="composer">
            <label className="field-title" htmlFor="dump">
              What’s on your mind?
            </label>
            <textarea
              id="dump"
              ref={textarea}
              value={text}
              maxLength={6000}
              placeholder="I need to tidy my room, reply to an email, and figure out dinner…"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  if (!busy && !listening) void split();
                }
              }}
              aria-describedby="dump-help dump-error"
            />
            <div className="composer-footer">
              <button
                className="primary"
                onClick={split}
                disabled={busy || listening}
              >
                {busy ? "Finding steps…" : "Find small steps"}
                <ArrowDown size={20} />
              </button>
              <button
                onClick={() => setVoiceOpen((v) => !v)}
                aria-expanded={voiceOpen}
                disabled={busy}
              >
                <Microphone size={22} />
                {voiceOpen ? "Close microphone" : "Use microphone"}
              </button>
            </div>
            <p id="dump-help" className="small muted">
              Enter to find steps · Shift+Enter for a new line. Nothing becomes
              a task until you review and save it.
            </p>
            {voiceOpen && (
              <Dictation
                active={active}
                onBusy={setListening}
                onText={(transcript) => {
                  const combined = `${text}${text ? "\n" : ""}${transcript}`;
                  if (combined.length > 6000) return false;
                  setText(combined);
                  textarea.current?.focus();
                  return true;
                }}
              />
            )}
          </div>
          <div className="planning-callout">
            <img
              className="decor"
              src="./art/planning-art.png"
              alt=""
              width="150"
              height="140"
            />
            <div>
              <h2>A smaller place to start</h2>
              <p>Turn your thoughts into steps you can review and change.</p>
              <p className="small muted">
                {aiEnabled
                  ? "Using browser AI with a local fallback."
                  : "Using the offline splitter. Suggestions may need editing."}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="review">
          <button
            className="text-button"
            onClick={() => {
              setSteps(null);
              setError("");
            }}
          >
            <ArrowLeft size={20} />
            Back to your note
          </button>
          <h2 tabIndex={-1} ref={review}>
            Review your steps
          </h2>
          <p>Change anything that doesn’t fit. These are suggested times.</p>
          {unclear.length > 0 && (
            <div className="inline-note">
              <h3>
                {steps.length
                  ? "Some thoughts need a little more detail"
                  : "Let’s make this a little clearer"}
              </h3>
              <p>
                The offline helper could not suggest specific steps for these
                parts. They have not been turned into tasks.
              </p>
              <ul>
                {unclear.map((part, index) => (
                  <li key={index}>{part}</li>
                ))}
              </ul>
              <p>
                Go back and describe an action, such as “call the dentist”, or
                add your own step below. Unused thoughts stay in your draft when
                you save.
              </p>
            </div>
          )}
          <div className="step-list">
            {steps.length > 0 && (
              <SpeakButton
                text={steps
                  .map((step, index) => `Step ${index + 1}. ${step.title}.`)
                  .join(" ")}
                settings={data.settings}
                label="Read my steps"
              />
            )}
            {steps.map((s, i) => (
              <div className="step-editor" key={i}>
                <label>
                  Step {i + 1}
                  <input
                    data-step-title
                    value={s.title}
                    maxLength={180}
                    onChange={(e) => edit(i, { title: e.target.value })}
                  />
                </label>
                <div className="step-details">
                  <label>
                    Minutes
                    <input
                      type="number"
                      min={2}
                      max={15}
                      value={s.minutes}
                      onChange={(e) =>
                        edit(i, { minutes: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Effort
                    <Select
                      value={s.effort}
                      onChange={(e) =>
                        edit(i, { effort: e.target.value as Step["effort"] })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </label>
                  <div className="step-tools">
                    <button
                      className="icon-button"
                      aria-label={`Move step ${i + 1} up`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp size={22} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Move step ${i + 1} down`}
                      disabled={i === steps.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown size={22} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Remove step ${i + 1}`}
                      onClick={() => {
                        setReviewUndo(steps);
                        setSteps(
                          (prev) => prev?.filter((_, j) => j !== i) ?? null,
                        );
                      }}
                    >
                      <Trash size={22} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {steps.length === 0 && unclear.length === 0 && (
            <p>All steps removed. Add a step or go back to your note.</p>
          )}
          <div className="button-row">
            <button
              disabled={steps.length >= 40}
              onClick={() => {
                setReviewUndo(steps);
                setSteps((prev) => [
                  ...(prev ?? []),
                  { title: "", minutes: 5, effort: "low" },
                ]);
              }}
            >
              <Plus size={20} />
              Add a step
            </button>
            {reviewUndo && (
              <button
                onClick={() => {
                  setSteps(reviewUndo);
                  setReviewUndo(null);
                }}
              >
                Undo step edit
              </button>
            )}
            <button
              className="primary"
              onClick={save}
              disabled={steps.length === 0}
            >
              <Check size={20} />
              Save steps
            </button>
          </div>
        </div>
      )}
      <p id="dump-error" role="alert" className="error">
        {error}
      </p>
    </section>
  );
}
