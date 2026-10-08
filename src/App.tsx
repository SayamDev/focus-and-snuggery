import { stopSpeaking } from "./features/voice/playback";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  House,
  NotePencil,
  Heart,
  FlowerLotus,
  GearSix,
  Plant,
  Moon,
  ShieldCheck,
  List,
  X,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useData } from "./services/useData";
import { orderTasks } from "./services/tasks";
import { toneCopy } from "./services/ai";
import type { Effort } from "./types";
import { BrainDump } from "./features/braindump/BrainDump";
import { Next } from "./features/next/Next";
import { CheckIn } from "./features/checkin/CheckIn";
import { Calm } from "./features/calm/Calm";
import { Settings } from "./features/settings/Settings";
import { Onboarding } from "./components/Onboarding";
type Page = "next" | "braindump" | "checkin" | "calm" | "settings";
const pages = [
  { id: "next", label: "What’s next", Icon: House },
  { id: "braindump", label: "Brain dump", Icon: NotePencil },
  { id: "checkin", label: "Check-in", Icon: Heart },
  { id: "calm", label: "Calming toolkit", Icon: FlowerLotus },
  { id: "settings", label: "Settings", Icon: GearSix },
] as const;
function route(): Page {
  const id = location.hash.slice(1);
  return pages.some((p) => p.id === id) ? (id as Page) : "next";
}
export default function App() {
  const {
    data,
    loaded,
    saving,
    error,
    notice,
    setNotice,
    update,
    restore,
    canUndo,
  } = useData();
  useEffect(() => {
    if (!saving) return;
    const protectPendingSave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectPendingSave);
    return () => window.removeEventListener("beforeunload", protectPendingSave);
  }, [saving]);
  const [draftRevision, setDraftRevision] = useState(0);
  const [page, setPage] = useState<Page>(route);
  const [energy, setEnergy] = useState<Effort>("low");
  const [aiEnabled, setAI] = useState(false);
  const [menu, setMenu] = useState(false);
  const [running, setRunning] = useState(false);
  const [intro, setIntro] = useState(false);
  const [laterOpen, setLaterOpen] = useState(false);
  const [laterIndex, setLaterIndex] = useState(0);
  const [systemDark, setSystemDark] = useState(
    () => matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [systemMotion, setSystemMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const main = useRef<HTMLElement>(null);
  const navFocus = useRef(false);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    stopSpeaking();
  }, [page]);
  const settings = data.settings;
  const theme =
    settings.theme === "system"
      ? systemDark
        ? "dark"
        : "light"
      : settings.theme;
  const reduced = settings.reducedMotion || systemMotion || settings.quiet;
  useEffect(() => {
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const d = () => setSystemDark(dark.matches);
    const m = () => setSystemMotion(motion.matches);
    dark.addEventListener("change", d);
    motion.addEventListener("change", m);
    return () => {
      dark.removeEventListener("change", d);
      motion.removeEventListener("change", m);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.font = settings.font;
    document.documentElement.dataset.textSize = settings.textSize;
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    document.documentElement.dataset.quiet = String(settings.quiet);
  }, [theme, settings.font, settings.textSize, reduced, settings.quiet]);
  useEffect(() => {
    const handler = () => {
      setPage(route());
      setMenu(false);
      navFocus.current = true;
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    if (navFocus.current) {
      main.current?.focus();
      navFocus.current = false;
    }
    document.title = `${pages.find((p) => p.id === page)?.label} | Focus & Snuggery`;
  }, [page]);
  const navigate = useCallback((target: Page) => {
    navFocus.current = true;
    setPage(target);
    setMenu(false);
    location.hash = target;
    requestAnimationFrame(() => main.current?.focus());
  }, []);
  const onRunning = useCallback((value: boolean) => setRunning(value), []);
  const ready = orderTasks(data.tasks, energy);
  const task = ready[0];
  const later = data.tasks
    .filter((t) => t.status === "later")
    .sort((a, b) => a.order - b.order);
  const laterTask = later[Math.min(laterIndex, Math.max(0, later.length - 1))];
  function finishIntro(startWithDump = false) {
    update(
      (d) => ({
        ...d,
        settings: {
          ...d.settings,
          onboarded: true,
          welcomeVersion: 1,
          displayName: d.settings.displayName.trim(),
        },
      }),
      "",
      false,
    );
    setIntro(false);
    navigate(startWithDump ? "braindump" : intro ? page : "next");
  }
  if (!loaded)
    return (
      <div className="loading" role="status">
        Opening your space…
      </div>
    );
  const heading =
    page === "next"
      ? settings.displayName.trim()
        ? `One thing at a time, ${settings.displayName.trim()}`
        : "One thing at a time"
      : page === "checkin"
        ? "How are you feeling right now?"
        : pages.find((p) => p.id === page)!.label;
  const descriptions: Record<Page, string> = {
    next: toneCopy(
      settings.tone,
      "Choose one task and work at your own pace.",
      "A calm space for what matters today.",
      "One task. Your pace.",
    ),
    braindump: "Get it out of your head. No structure, no pressure.",
    checkin: "Choose the feeling that is closest. There’s no right answer.",
    calm: "A moment to pause, whenever you need it.",
    settings: "Make Focus & Snuggery work for you.",
  };
  return (
    <>
      {(!settings.onboarded || settings.welcomeVersion < 1 || intro) && (
        <Onboarding
          settings={settings}
          onChange={(value) =>
            update(
              (d) => ({ ...d, settings: { ...d.settings, ...value } }),
              "",
              false,
            )
          }
          onFinish={finishIntro}
        />
      )}
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to main content
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="brand">
              <Plant size={36} weight="fill" />
              <span>Focus &amp; Snuggery</span>
            </div>
            <button
              className="menu-toggle icon-button"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-controls="navigation"
              aria-label={menu ? "Close navigation" : "Open navigation"}
            >
              {menu ? <X size={25} /> : <List size={25} />}
            </button>
          </div>
          <nav
            id="navigation"
            className={`nav ${menu ? "open" : ""}`}
            aria-label="Main navigation"
          >
            {pages.map(({ id, label, Icon }) => (
              <button
                key={id}
                aria-current={page === id ? "page" : undefined}
                onClick={() => navigate(id)}
              >
                <Icon size={26} weight="regular" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <ShieldCheck size={20} />
            <p>
              {settings.displayName.trim()
                ? `${settings.displayName.trim()}’s space.`
                : "Just you and your device."}
              <br />
              <span className="small">Free. Private. At your pace.</span>
            </p>
          </div>
        </aside>
        <main id="main-content" className="main" ref={main} tabIndex={-1}>
          <header className="header">
            <div className="heading">
              <h1>{heading}</h1>
              <p>{descriptions[page]}</p>
            </div>
            <div className="preferences">
              <button
                className="quiet"
                role="switch"
                aria-checked={settings.quiet}
                onClick={() =>
                  update(
                    (d) => ({
                      ...d,
                      settings: { ...d.settings, quiet: !d.settings.quiet },
                    }),
                    "Quiet mode changed.",
                  )
                }
              >
                <Moon size={21} />
                Quiet mode
                <span
                  className={`switch ${settings.quiet ? "on" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {page === "next" && (
                <fieldset className="energy" disabled={running}>
                  <legend>Energy</legend>
                  {(["low", "medium", "high"] as const).map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="energy"
                        value={value}
                        checked={energy === value}
                        onChange={() => setEnergy(value)}
                      />
                      <span>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
          </header>
          {running && (
            <p className="small muted">
              Focus timer is running. Pause it to change your energy level.
            </p>
          )}
          <div hidden={page !== "next"}>
            <Next
              key={draftRevision}
              task={task}
              data={data}
              update={update}
              onDump={() => navigate("braindump")}
              onNotice={setNotice}
              aiEnabled={aiEnabled}
              onRunning={onRunning}
              active={page === "next"}
            />
            {later.length > 0 && (
              <div className="later">
                <button
                  className="text-button"
                  aria-expanded={laterOpen}
                  onClick={() => setLaterOpen((v) => !v)}
                >
                  Saved for later ({later.length})
                </button>
                {laterOpen && laterTask && (
                  <section className="panel">
                    <h2>{laterTask.title}</h2>
                    <p className="muted">
                      {Math.min(laterIndex + 1, later.length)} of {later.length}
                      . No rush.
                    </p>
                    <div className="button-row">
                      <button
                        className="icon-button"
                        aria-label="Previous later task"
                        disabled={laterIndex === 0}
                        onClick={() => setLaterIndex((i) => i - 1)}
                      >
                        <ArrowLeft size={22} />
                      </button>
                      <button
                        onClick={() => {
                          update(
                            (d) => ({
                              ...d,
                              tasks: d.tasks.map((t) =>
                                t.id === laterTask.id
                                  ? { ...t, status: "ready" }
                                  : t,
                              ),
                            }),
                            "Task returned to your suggestions.",
                          );
                          setLaterIndex(0);
                        }}
                        disabled={running}
                      >
                        Bring this back
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Next later task"
                        disabled={laterIndex >= later.length - 1}
                        onClick={() => setLaterIndex((i) => i + 1)}
                      >
                        <ArrowRight size={22} />
                      </button>
                    </div>
                  </section>
                )}
              </div>
            )}
            {settings.mode === "detailed" && (
              <p className="small muted">
                {ready.length} ready {ready.length === 1 ? "task" : "tasks"}.
                Suggestions match your current energy.
              </p>
            )}
          </div>
          <div hidden={page !== "braindump"}>
            <BrainDump
              key={draftRevision}
              data={data}
              update={update}
              onSaved={() => navigate("next")}
              aiEnabled={aiEnabled}
              active={page === "braindump"}
            />
          </div>
          {page === "checkin" && (
            <CheckIn
              data={data}
              update={update}
              onCalm={() => navigate("calm")}
            />
          )}
          {page === "calm" && (
            <Calm
              settings={settings}
              reduced={reduced}
              onReturn={() => navigate("next")}
            />
          )}
          {page === "settings" && (
            <Settings
              data={data}
              update={update}
              onNotice={setNotice}
              aiEnabled={aiEnabled}
              setAI={setAI}
              onIntro={() => setIntro(true)}
              onResetDraft={() => setDraftRevision((v) => v + 1)}
            />
          )}
          {error && (
            <p className="error inline-note" role="alert">
              {error}
            </p>
          )}
          <div className="status-bar" role="status" aria-live="polite">
            <span>{notice}</span>
            {canUndo && (
              <button className="text-button" onClick={restore}>
                Undo
              </button>
            )}
          </div>
          {needRefresh && (
            <div className="inline-note">
              <p>
                An app update is ready. Reload when you’re ready; this resets
                the timer.
              </p>
              <button disabled={saving} onClick={() => void updateServiceWorker(true)}>
                Reload app
              </button>
            </div>
          )}
          {offlineReady && settings.mode === "detailed" && (
            <p className="small muted">App saved for offline use.</p>
          )}
          <footer className="app-footer">
            A support tool, not medical treatment.
          </footer>
        </main>
      </div>
    </>
  );
}
