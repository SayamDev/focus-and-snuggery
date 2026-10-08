import { useState } from "react";
import type { Settings, Task } from "../../types";
import { useTimer } from "./useTimer";
import { breakMinutes, focusMinutes, type Phase, type Rhythm } from "./rhythm";
export function useFocusSession(
  task: Task | undefined,
  settings: Settings,
  onNotice: (message: string) => void,
) {
  const [rhythm, setRhythm] = useState<Rhythm>("flexible");
  const [phase, setPhase] = useState<Phase>("focus");
  const [rounds, setRounds] = useState(0);
  const [revision, setRevision] = useState(0);
  const [finished, setFinished] = useState(false);
  const duration =
    phase === "focus"
      ? focusMinutes(rhythm, task?.minutes ?? 5)
      : breakMinutes(rhythm, rounds);
  const timer = useTimer(duration, settings, onNotice, {
    resetKey: `${rhythm}:${phase}:${revision}:${rhythm === "flexible" ? (task?.id ?? "empty") : ""}`,
    phase,
    onComplete: () => {
      setFinished(true);
      if (!finished && phase === "focus" && rhythm !== "flexible")
        setRounds((n) => n + 1);
    },
  });
  function chooseRhythm(value: Rhythm) {
    timer.reset();
    setRhythm(value);
    setPhase("focus");
    setRounds(0);
    setFinished(false);
    setRevision((n) => n + 1);
  }
  function nextPhase(value: Phase) {
    timer.reset();
    setPhase(value);
    setFinished(false);
    setRevision((n) => n + 1);
  }
  function reset() {
    timer.reset();
    setFinished(false);
  }
  function add() {
    timer.add();
  }
  return {
    ...timer,
    add,
    reset,
    rhythm,
    phase,
    rounds,
    finished,
    chooseRhythm,
    nextPhase,
    breakMinutes: breakMinutes(rhythm, rounds),
  };
}
export type FocusSession = ReturnType<typeof useFocusSession>;
