import { z } from "zod";
export const effortSchema = z.enum(["low", "medium", "high"]);
export type Effort = z.infer<typeof effortSchema>;
export const stepSchema = z
  .object({
    title: z.string().trim().min(3).max(180),
    minutes: z.number().int().min(2).max(15),
    effort: effortSchema,
  })
  .strict();
export const stepsSchema = z.array(stepSchema).min(1).max(40);
export type Step = z.infer<typeof stepSchema>;
export const taskSchema = stepSchema.extend({
  id: z.string(),
  order: z.number(),
  status: z.enum(["ready", "later", "done"]),
  createdAt: z.number(),
  completedAt: z.number().optional(),
});
export type Task = z.infer<typeof taskSchema>;
export const settingsSchema = z.object({
  theme: z.enum(["system", "light", "dark", "low-sensory", "contrast"]),
  font: z.enum(["default", "atkinson"]),
  textSize: z.enum(["normal", "large", "larger"]),
  reducedMotion: z.boolean(),
  mode: z.enum(["simple", "detailed"]),
  notification: z.enum(["none", "soft", "vibration"]),
  tone: z.enum(["neutral", "warm", "brief"]),
  quiet: z.boolean(),
  country: z.enum(["GB", "US", "other"]),
  onboarded: z.boolean(),
  displayName: z.string().max(48).default(""),
  welcomeVersion: z.number().int().min(0).default(1),
  voiceEngine: z.enum(["device", "natural"]).default("device"),
  voiceName: z.enum(["bf_emma", "bm_george", "af_heart"]).default("bf_emma"),
  voiceSpeed: z.number().min(0.8).max(1.15).default(1),
});
export type Settings = z.infer<typeof settingsSchema>;
export const defaults: Settings = {
  theme: "system",
  font: "default",
  textSize: "normal",
  reducedMotion: false,
  mode: "simple",
  notification: "none",
  tone: "warm",
  quiet: false,
  country: "GB",
  onboarded: false,
  displayName: "",
  welcomeVersion: 0,
  voiceEngine: "device",
  voiceName: "bf_emma",
  voiceSpeed: 1,
};
export const checkinSchema = z.object({
  id: z.string(),
  mood: z.enum(["low", "okay", "good"]),
  sensory: z.enum(["loud", "bright", "busy", "fine"]).nullable(),
  createdAt: z.number(),
});
export type Checkin = z.infer<typeof checkinSchema>;
export const dataSchema = z.object({
  version: z.literal(1),
  tasks: z.array(taskSchema).max(10000),
  checkins: z.array(checkinSchema).max(10000),
  settings: settingsSchema,
});
export type AppData = z.infer<typeof dataSchema>;
