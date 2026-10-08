import { useEffect, useRef, useState } from "react";
import type { Settings } from "../../types";
export function useTimer(
  minutes: number,
  settings: Settings,
  onNotice: (s: string) => void,
  options?: {
    resetKey: string;
    phase: "focus" | "break";
    onComplete: () => void;
  },
) {
  const [remaining, setRemaining] = useState(minutes * 60);
  const [total, setTotal] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  const completed = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const warned = useRef(false);
  const onNoticeRef = useRef(onNotice);
  onNoticeRef.current = onNotice;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left <= 60 && !warned.current && left > 0) {
        warned.current = true;
        notify("About one minute left. You can pause or add time.");
      }
      if (left === 0 && !completed.current) {
        completed.current = true;
        setRunning(false);
        notify(
          optionsRef.current?.phase === "break"
            ? "Your break time is complete. Come back when you are ready."
            : "Your focus time is complete. Take your time choosing what comes next.",
        );
        optionsRef.current?.onComplete();
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [running]);
  useEffect(() => {
    setRunning(false);
    setRemaining(minutes * 60);
    setTotal(minutes * 60);
    warned.current = false;
    completed.current = false;
  }, [minutes, options?.resetKey]);
  function notify(message: string) {
    onNoticeRef.current(message);
    const s = settingsRef.current;
    if (s.quiet || s.notification === "none") return;
    if (s.notification === "vibration") navigator.vibrate?.(100);
    if (
      s.notification === "soft" &&
      "Notification" in window &&
      Notification.permission === "granted"
    )
      new Notification("Focus & Snuggery", {
        body: message,
        tag: "focusnest-timer",
      });
  }
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    async function acquire() {
      if (
        !running ||
        document.visibilityState !== "visible" ||
        !("wakeLock" in navigator)
      )
        return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) await next.release();
        else lock = next;
      } catch {
        /* The timer works even when wake lock is denied. */
      }
    }
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release();
    };
  }, [running]);
  function toggle() {
    if (running) {
      setRemaining(
        Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)),
      );
      setRunning(false);
    } else if (remaining > 0) {
      deadline.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  }
  function add() {
    completed.current = false;
    setTotal((t) => t + 120);
    setRemaining((r) => r + 120);
    if (running) deadline.current += 120000;
    warned.current = false;
  }
  function reset() {
    completed.current = false;
    setRunning(false);
    setRemaining(minutes * 60);
    setTotal(minutes * 60);
    warned.current = false;
  }
  return { remaining, total, running, toggle, add, reset };
}
