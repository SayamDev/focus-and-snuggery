import { useEffect, useRef, useState } from "react";
import { loadData, saveData } from "./storage";
import { dataSchema, defaults, type AppData } from "../types";
const empty = (): AppData => ({
  version: 1,
  tasks: [],
  checkins: [],
  settings: { ...defaults },
});
export function useData() {
  const [data, setData] = useState<AppData>(empty);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [undo, setUndo] = useState<AppData | null>(null);
  const current = useRef(data);
  const queue = useRef(Promise.resolve());
  const writes = useRef(0);
  useEffect(() => {
    loadData()
      .then((d) => {
        current.current = d;
        setData(d);
        setLoaded(true);
      })
      .catch(() => {
        setError(
          "Device storage is unavailable. Changes will stay in this tab only. Export a backup before closing.",
        );
        setLoaded(true);
      });
  }, []);
  function update(
    fn: (d: AppData) => AppData,
    message = "",
    reversible = true,
  ) {
    const before = current.current;
    const parsed = dataSchema.safeParse(fn(before));
    if (!parsed.success) {
      setError(
        "This change could not be saved. Check your entries or export a backup if your data is full.",
      );
      return;
    }
    const next = parsed.data;
    if (reversible) setUndo(before);
    current.current = next;
    setData(next);
    setSaving(true);
    setNotice("Saving changes…");
    // Serialize snapshots so rapid edits cannot let an older write win.
    const revision = ++writes.current;
    queue.current = queue.current
      .catch(() => {})
      .then(() => saveData(next))
      .then(() => {
        if (revision === writes.current) {
          setError("");
          setSaving(false);
          setNotice(message);
        }
      })
      .catch(() => {
        if (revision === writes.current) {
          setSaving(false);
          setNotice("Changes are in this tab only.");
          setError(
            "Changes could not be saved to this device. Export a backup before closing.",
          );
        }
      });
  }
  function restore() {
    if (undo) {
      const previous = undo;
      update(() => previous, "Change undone.", false);
      setUndo(null);
    }
  }
  return {
    data,
    loaded,
    saving,
    error,
    notice,
    setNotice,
    update,
    restore,
    canUndo: !!undo,
  };
}
