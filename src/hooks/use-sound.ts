import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "cg_sound";

export type SoundName = "pick" | "correct" | "wrong" | "tick" | "start" | "gameover" | "hint";

export function useSound() {
  const [enabled, setEnabled] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setEnabled(stored === "1");
  }, []);

  const toggle = useCallback(() => {
    setEnabled((e) => {
      const next = !e;
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const getCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const tones: Record<SoundName, { freq: number; dur: number; type: OscillatorType; sweep?: number; gain?: number }> = {
        pick: { freq: 520, dur: 0.06, type: "square", gain: 0.05 },
        correct: { freq: 660, dur: 0.22, type: "triangle", sweep: 1320, gain: 0.08 },
        wrong: { freq: 200, dur: 0.3, type: "sawtooth", sweep: 80, gain: 0.07 },
        tick: { freq: 880, dur: 0.04, type: "square", gain: 0.03 },
        start: { freq: 440, dur: 0.18, type: "triangle", sweep: 880, gain: 0.07 },
        gameover: { freq: 330, dur: 0.5, type: "sawtooth", sweep: 110, gain: 0.08 },
        hint: { freq: 740, dur: 0.1, type: "sine", gain: 0.06 },
      };
      const t = tones[name];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = t.type;
      osc.frequency.setValueAtTime(t.freq, now);
      if (t.sweep) osc.frequency.exponentialRampToValueAtTime(t.sweep, now + t.dur);
      gain.gain.setValueAtTime(t.gain ?? 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + t.dur + 0.02);
    },
    [enabled, getCtx],
  );

  return { enabled, toggle, play };
}