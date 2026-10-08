import Dexie, { type Table } from "dexie";
import {
  dataSchema,
  defaults,
  type AppData,
  type Task,
  type Checkin,
} from "../types";
class FocusDB extends Dexie {
  tasks!: Table<Task, string>;
  checkins!: Table<Checkin, string>;
  preferences!: Table<{ id: string; value: unknown }, string>;
  constructor() {
    // Keep the original database name so a brand change preserves saved data.
    super("focusnest");
    this.version(1).stores({
      tasks: "id,status,order",
      checkins: "id,createdAt",
      preferences: "id",
    });
  }
}
const db = new FocusDB();
export async function loadData(): Promise<AppData> {
  const [tasks, checkins, pref] = await Promise.all([
    db.tasks.toArray(),
    db.checkins.toArray(),
    db.preferences.get("settings"),
  ]);
  return dataSchema.parse({
    version: 1,
    tasks,
    checkins,
    settings: pref?.value ?? defaults,
  });
}
export async function saveData(data: AppData): Promise<void> {
  const parsed = dataSchema.parse(data);
  await db.transaction(
    "rw",
    db.tasks,
    db.checkins,
    db.preferences,
    async () => {
      await db.tasks.clear();
      await db.tasks.bulkPut(parsed.tasks);
      await db.checkins.clear();
      await db.checkins.bulkPut(parsed.checkins);
      await db.preferences.put({ id: "settings", value: parsed.settings });
    },
  );
}
export function parseImport(text: string): AppData {
  if (text.length > 10_000_000) throw new Error("This backup is too large");
  const data = dataSchema.parse(JSON.parse(text));
  if (
    new Set(data.tasks.map((t) => t.id)).size !== data.tasks.length ||
    new Set(data.checkins.map((c) => c.id)).size !== data.checkins.length
  )
    throw new Error("Duplicate IDs in backup");
  return data;
}
export function downloadData(data: AppData) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `focus-and-snuggery-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
