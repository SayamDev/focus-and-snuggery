export type Rhythm = "flexible" | "gentle" | "pomodoro";
export type Phase = "focus" | "break";
export function focusMinutes(rhythm: Rhythm, estimate: number) {
  return rhythm === "gentle" ? 10 : rhythm === "pomodoro" ? 25 : estimate;
}
export function breakMinutes(rhythm: Rhythm, rounds: number) {
  return rhythm === "pomodoro" && rounds > 0 && rounds % 4 === 0
    ? 15
    : rhythm === "gentle"
      ? 3
      : 5;
}
export const rhythmLabels: Record<Rhythm, string> = {
  flexible: "Flexible",
  gentle: "Gentle · 10 / 3",
  pomodoro: "Pomodoro · 25 / 5",
};
