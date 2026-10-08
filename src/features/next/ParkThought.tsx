import { useRef, useState } from "react";
import { NotePencil } from "@phosphor-icons/react";
import type { AppData } from "../../types";
import { isCrisis, newTasks } from "../../services/tasks";
import { CrisisSupport } from "../../components/CrisisSupport";
export function ParkThought({
  data,
  update,
}: {
  data: AppData;
  update: (fn: (d: AppData) => AppData, message?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [crisis, setCrisis] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  function save() {
    if (text.trim().length < 3) {
      setError(
        "Add at least three characters so you can recognise this later.",
      );
      input.current?.focus();
      return;
    }
    if (isCrisis(text)) {
      setCrisis(true);
      return;
    }
    update(
      (d) => ({
        ...d,
        tasks: [
          ...d.tasks,
          ...newTasks(
            [{ title: text.trim(), minutes: 2, effort: "low" }],
            Math.max(-1, ...d.tasks.map((t) => t.order)) + 1,
          ).map((t) => ({ ...t, status: "later" as const })),
        ],
      }),
      "Thought saved to Later. You can return to this task.",
    );
    setText("");
    setError("");
    input.current?.focus();
  }
  return (
    <section className="park-thought">
      <button
        className="text-button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <NotePencil size={22} />
        Something else on your mind?
      </button>
      {open &&
        (crisis ? (
          <CrisisSupport
            country={data.settings.country}
            onCountry={(country) =>
              update((d) => ({ ...d, settings: { ...d.settings, country } }))
            }
            onClear={() => {
              setText("");
              setCrisis(false);
            }}
          />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label>
              Save a thought for later
              <input
                ref={input}
                autoFocus
                value={text}
                maxLength={180}
                onChange={(e) => setText(e.target.value)}
                placeholder="Something to remember…"
                aria-describedby="park-help park-error"
              />
            </label>
            <p id="park-help" className="small muted">
              Keeps your current task and timer in place. You can edit this
              thought when you return to it.
            </p>
            <button type="submit">Save to Later</button>
            <p id="park-error" className="error" role="alert">
              {error}
            </p>
          </form>
        ))}
    </section>
  );
}
