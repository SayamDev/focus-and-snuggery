import { Select } from "../../components/Select";
import { VoiceSettings } from "../voice/VoiceSettings";
import { useRef, useState } from "react";
import {
  Download,
  Upload,
  Trash,
  Leaf,
  TextAa,
  ShieldCheck,
  Sliders,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  defaults,
  type AppData,
  type Settings as Preferences,
} from "../../types";
import { downloadData, parseImport } from "../../services/storage";
import { browserAI } from "../../services/ai";
import { requestNotifications, clearModelCache } from "../../services/browser";
export function Settings({
  data,
  update,
  onNotice,
  aiEnabled,
  setAI,
  onIntro,
  onResetDraft,
}: {
  data: AppData;
  update: (
    fn: (d: AppData) => AppData,
    message?: string,
    reversible?: boolean,
  ) => void;
  onNotice: (s: string) => void;
  aiEnabled: boolean;
  setAI: (b: boolean) => void;
  onIntro: () => void;
  onResetDraft: () => void;
}) {
  const s = data.settings;
  const [pending, setPending] = useState<AppData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [modelBusy, setModelBusy] = useState(false);
  const [modelProgress, setModelProgress] = useState("");
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  function pref<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    update(
      (d) => ({ ...d, settings: { ...d.settings, [key]: value } }),
      "Preference saved.",
    );
  }
  async function importFile(f: File | undefined) {
    if (!f) return;
    try {
      if (f.size > 10_000_000) throw new Error("size");
      setPending(parseImport(await f.text()));
      setError("");
    } catch {
      setError(
        "This file is not a valid Focus & Snuggery backup. Choose a version 1 JSON export under 10 MB.",
      );
    }
    if (file.current) file.current.value = "";
  }
  async function loadAI() {
    setModelBusy(true);
    setError("");
    try {
      await browserAI.load(setModelProgress);
      setAI(true);
      onNotice("Browser AI is ready for this session.");
    } catch (e) {
      setError(
        (e as Error).message ||
          "The model could not load. The offline splitter is still available.",
      );
      setAI(false);
    } finally {
      setModelBusy(false);
    }
  }
  return (
    <section>
      <section
        className="panel profile-settings"
        aria-labelledby="profile-heading"
      >
        <div>
          <h2 id="profile-heading">Your space</h2>
          <p className="muted">
            A name to make it feel like yours. It stays on this device.
          </p>
        </div>
        <label>
          Your name (optional)
          <input
            autoComplete="given-name"
            maxLength={48}
            value={s.displayName}
            onChange={(e) => pref("displayName", e.target.value)}
            placeholder="Your first name"
          />
        </label>
        <button onClick={onIntro}>Show introduction</button>
      </section>
      <VoiceSettings
        settings={s}
        onChange={(patch) =>
          update(
            (d) => ({ ...d, settings: { ...d.settings, ...patch } }),
            "Voice preference saved.",
          )
        }
      />
      <div className="settings-grid">
        <article className="panel">
          <h2>
            <Sliders size={25} />
            Comfort
          </h2>
          <label>
            Theme
            <Select
              aria-label="Theme"
              value={s.theme}
              onChange={(e) =>
                pref("theme", e.target.value as Preferences["theme"])
              }
            >
              <option value="system">Match device</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="low-sensory">Low sensory</option>
              <option value="contrast">High contrast</option>
            </Select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={s.reducedMotion}
              onChange={(e) => pref("reducedMotion", e.target.checked)}
            />
            Reduce motion
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={s.quiet}
              onChange={(e) => pref("quiet", e.target.checked)}
            />
            Quiet mode
          </label>
          <p className="small muted">
            Quiet mode dims the page, hides decorative images, and silences
            alerts.
          </p>
        </article>
        <article className="panel">
          <h2>
            <TextAa size={25} />
            Reading
          </h2>
          <label>
            Font
            <Select
              aria-label="Font"
              value={s.font}
              onChange={(e) =>
                pref("font", e.target.value as Preferences["font"])
              }
            >
              <option value="default">Lato</option>
              <option value="atkinson">Atkinson Hyperlegible</option>
            </Select>
          </label>
          <label>
            Text size
            <Select
              aria-label="Text size"
              value={s.textSize}
              onChange={(e) =>
                pref("textSize", e.target.value as Preferences["textSize"])
              }
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="larger">Larger</option>
            </Select>
          </label>
          <label>
            Detail level
            <Select
              aria-label="Detail level"
              value={s.mode}
              onChange={(e) =>
                pref("mode", e.target.value as Preferences["mode"])
              }
            >
              <option value="simple">Simple</option>
              <option value="detailed">Detailed</option>
            </Select>
          </label>
        </article>
        <article className="panel">
          <h2>
            <Leaf size={25} />
            Guidance
          </h2>
          <label>
            Tone
            <Select
              aria-label="Tone"
              value={s.tone}
              onChange={(e) =>
                pref("tone", e.target.value as Preferences["tone"])
              }
            >
              <option value="neutral">Neutral</option>
              <option value="warm">Warm</option>
              <option value="brief">Brief</option>
            </Select>
          </label>
          <label>
            Notification style
            <Select
              aria-label="Notification style"
              value={s.notification}
              onChange={(e) =>
                pref(
                  "notification",
                  e.target.value as Preferences["notification"],
                )
              }
            >
              <option value="none">On-screen only</option>
              <option value="soft">Soft notification</option>
              <option value="vibration">Vibration</option>
            </Select>
          </label>
          {s.notification === "soft" && (
            <button
              onClick={async () => onNotice(await requestNotifications())}
            >
              Enable device notifications
            </button>
          )}
          {s.notification === "vibration" && !("vibrate" in navigator) && (
            <p className="small muted">
              Vibration is not supported here. On-screen cues still work.
            </p>
          )}
          <label>
            Country for support links
            <Select
              aria-label="Country for support links"
              value={s.country}
              onChange={(e) =>
                pref("country", e.target.value as Preferences["country"])
              }
            >
              <option value="GB">UK and Ireland</option>
              <option value="US">United States</option>
              <option value="other">Another country</option>
            </Select>
          </label>
        </article>
      </div>
      <div className="settings-grid lower">
        <article className="panel">
          <h2>
            <ShieldCheck size={25} />
            Your data
          </h2>
          <p>Saved in this browser, on this device. No account or tracking.</p>
          <p className="small muted">
            Export a backup before clearing browser data. Backups contain your
            private notes and check-ins.
          </p>
          <div className="button-row">
            <button
              onClick={() => {
                downloadData(data);
                onNotice("Backup downloaded. Keep it somewhere private.");
              }}
            >
              <Download size={21} />
              Export data
            </button>
            <button onClick={() => file.current?.click()}>
              <Upload size={21} />
              Import data
            </button>
          </div>
          <input
            hidden
            tabIndex={-1}
            ref={file}
            type="file"
            accept=".json,application/json"
            aria-label="Choose backup file"
            onChange={(e) => void importFile(e.target.files?.[0])}
          />
          <button
            className="text-button"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash size={21} />
            Delete everything
          </button>
          {pending && (
            <div className="inline-note">
              <h3>Replace data with this backup?</h3>
              <p>
                This backup has {pending.tasks.length} tasks and{" "}
                {pending.checkins.length} check-ins. It will replace your
                current data and preferences.
              </p>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    update(
                      () => ({
                        ...pending,
                        settings: { ...pending.settings, onboarded: true, welcomeVersion: 1 },
                      }),
                      "Backup imported.",
                    );
                    onResetDraft();
                    setPending(null);
                  }}
                >
                  Replace with backup
                </button>
                <button onClick={() => setPending(null)}>Cancel import</button>
              </div>
            </div>
          )}
          {confirmDelete && (
            <div className="inline-note">
              <h3>Delete everything on this device?</h3>
              <p>
                Tasks, check-ins and preferences will be removed. Export first
                for a lasting backup. You can undo while this tab stays open.
              </p>
              <div className="button-row">
                <button
                  onClick={() => {
                    update(
                      () => ({
                        version: 1,
                        tasks: [],
                        checkins: [],
                        settings: {
                          ...defaults,
                          onboarded: true,
                          welcomeVersion: 1,
                        },
                      }),
                      "Data deleted. Undo is available in this tab.",
                    );
                    onResetDraft();
                    setConfirmDelete(false);
                  }}
                >
                  Confirm deletion
                </button>
                <button onClick={() => setConfirmDelete(false)}>
                  Keep my data
                </button>
              </div>
            </div>
          )}
        </article>
        <article className="panel">
          <h2>
            Browser AI <span className="small muted">optional</span>
          </h2>
          <p>
            The offline splitter is ready. You can also download a small open
            model to process thoughts on your device.
          </p>
          <p className="small muted">
            Initial download may be hundreds of MB and needs internet and
            WebGPU. Your task text stays local. Model hosts receive download
            network information. Cached models may be removed by your browser.
          </p>
          {aiEnabled ? (
            <button
              onClick={() => {
                setAI(false);
                void browserAI.unload();
                onNotice("Using the offline splitter.");
              }}
            >
              Use offline splitter
            </button>
          ) : (
            <button className="primary" onClick={loadAI} disabled={modelBusy}>
              {modelBusy ? "Downloading model…" : "Download and enable AI"}
            </button>
          )}
          {modelBusy && (
            <p className="small" role="status">
              {modelProgress ||
                "Preparing the download. The rest of the app is still available."}
            </p>
          )}
          <button
            className="text-button"
            disabled={modelBusy}
            onClick={async () => {
              setAI(false);
              await browserAI.unload();
              await clearModelCache();
              onNotice("Browser AI disabled and its named caches cleared.");
            }}
          >
            Clear model cache
          </button>
        </article>
        <article className="panel">
          <h2>Install Focus &amp; Snuggery</h2>
          <p className="small muted">
            Use your browser’s install or “Add to Home Screen” option. The app
            works offline after a successful production load.
          </p>
        </article>
      </div>
      <p className="error" role="alert">
        {error}
      </p>
    </section>
  );
}
