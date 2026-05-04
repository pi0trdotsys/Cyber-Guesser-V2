import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Volume2, VolumeX, RotateCcw, X } from "lucide-react";
import { SNIPPETS, type Snippet } from "@/data/snippets";
import { useSound } from "@/hooks/use-sound";

export const Route = createFileRoute("/")({
  component: Game,
});

type Phase = "intro" | "playing" | "result" | "gameover";

const ROUND_TIME = 30;
const HINT_COST = 50;
const TOTAL_ROUNDS = 7;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Game() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [deck, setDeck] = useState<Snippet[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [time, setTime] = useState(ROUND_TIME);
  const [picked, setPicked] = useState<number | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const sound = useSound();

  const current = deck[round];

  useEffect(() => {
    const b = typeof window !== "undefined" ? Number(localStorage.getItem("cg_best") || 0) : 0;
    setBest(b);
  }, []);

  useEffect(() => {
    if (phase !== "playing" || picked !== null) return;
    if (time <= 0) {
      lockAnswer(-1);
      return;
    }
    if (time <= 5) sound.play("tick");
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, phase, picked]);

  function start() {
    sound.play("start");
    setDeck(shuffle(SNIPPETS).slice(0, TOTAL_ROUNDS));
    setRound(0);
    setScore(0);
    setStreak(0);
    setTime(ROUND_TIME);
    setPicked(null);
    setHintShown(false);
    setPhase("playing");
  }

  function exitToMenu() {
    setPhase("intro");
    setPicked(null);
    setHintShown(false);
    setTime(ROUND_TIME);
    setRound(0);
    setScore(0);
    setStreak(0);
    setConfirmExit(false);
  }

  function requestExit() {
    if (phase === "intro" || phase === "gameover") {
      exitToMenu();
      return;
    }
    setConfirmExit(true);
  }

  function lockAnswer(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (current && idx === current.answer) {
      const base = 100;
      const timeBonus = time * 5;
      const streakBonus = streak * 25;
      const diffMul = current.difficulty === "easy" ? 1 : current.difficulty === "medium" ? 1.5 : 2;
      const gained = Math.round((base + timeBonus + streakBonus) * diffMul);
      setScore((s) => s + gained);
      setStreak((s) => s + 1);
      sound.play("correct");
    } else {
      setStreak(0);
      sound.play("wrong");
    }
    setPhase("result");
  }

  function next() {
    const nextRound = round + 1;
    if (nextRound >= deck.length) {
      if (score > best) {
        setBest(score);
        if (typeof window !== "undefined") localStorage.setItem("cg_best", String(score));
      }
      sound.play("gameover");
      setPhase("gameover");
      return;
    }
    setRound(nextRound);
    setTime(ROUND_TIME);
    setPicked(null);
    setHintShown(false);
    setPhase("playing");
  }

  function useHint() {
    if (hintShown || picked !== null) return;
    setHintShown(true);
    setScore((s) => Math.max(0, s - HINT_COST));
    sound.play("hint");
  }

  // Keyboard shortcuts: 1-4 select option, H = hint, Enter = next, M = mute
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key.toLowerCase() === "m") {
        sound.toggle();
        return;
      }
      if (phase === "playing" && current && picked === null) {
        const n = Number(e.key);
        if (n >= 1 && n <= current.options.length) {
          sound.play("pick");
          lockAnswer(n - 1);
        } else if (e.key.toLowerCase() === "h") {
          useHint();
        }
      } else if (phase === "result" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        next();
      } else if ((phase === "intro" || phase === "gameover") && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        start();
      } else if (phase === "gameover" && e.key.toLowerCase() === "r") {
        e.preventDefault();
        start();
      } else if ((phase === "playing" || phase === "result") && e.key.toLowerCase() === "r") {
        e.preventDefault();
        start();
      } else if ((phase === "playing" || phase === "result") && e.key === "Escape") {
        e.preventDefault();
        if (confirmExit) setConfirmExit(false);
        else requestExit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current, picked, hintShown, confirmExit]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <a href="#main-content" className="skip-link focus-neon">Skip to main content</a>
      <BackgroundFX />
      <div id="main-content" className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:px-6">
        <Header
          score={score}
          streak={streak}
          best={best}
          soundEnabled={sound.enabled}
          onToggleSound={sound.toggle}
          inSession={phase !== "intro" && phase !== "gameover"}
          onRestart={start}
          onExit={requestExit}
        />

        {phase === "intro" && <Intro onStart={start} best={best} />}

        {phase !== "intro" && phase !== "gameover" && current && (
          <GameBoard
            snippet={current}
            phase={phase}
            time={time}
            picked={picked}
            hintShown={hintShown}
            round={round}
            total={deck.length}
            onPick={(i) => { sound.play("pick"); lockAnswer(i); }}
            onHint={useHint}
            onNext={next}
          />
        )}

        {phase === "gameover" && <GameOver score={score} best={best} onRestart={start} />}

        <footer className="mt-auto pt-8 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
          cyber_guesser
        </footer>
      </div>
      {confirmExit && (
        <ConfirmExit onCancel={() => setConfirmExit(false)} onConfirm={exitToMenu} />
      )}
    </main>
  );
}

function BackgroundFX() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-30"
      style={{
        background:
          "radial-gradient(ellipse at 20% 0%, oklch(0.7 0.28 330 / 0.12), transparent 55%), radial-gradient(ellipse at 80% 100%, oklch(0.85 0.25 145 / 0.10), transparent 55%)",
      }}
    />
  );
}

function Header({ score, streak, best, soundEnabled, onToggleSound, inSession, onRestart, onExit }: { score: number; streak: number; best: number; soundEnabled: boolean; onToggleSound: () => void; inSession: boolean; onRestart: () => void; onExit: () => void }) {
  return (
    <header className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
      <h1 className="font-display text-xl font-black sm:text-2xl">
        <span className="text-neon">CYBER</span>
        <span className="text-muted-foreground">_</span>
        <span className="text-neon-pink">GUESSER</span>
      </h1>
      <div className="flex items-center gap-4 text-xs sm:text-sm">
        <Stat label="SCORE" value={score} color="text-neon" />
        <Stat label="STREAK" value={`x${streak}`} color="text-neon-pink" />
        <Stat label="BEST" value={best} color="text-neon-cyan" />
        <div className="flex items-center gap-1.5">
          <IconBtn
            onClick={onToggleSound}
            ariaLabel={soundEnabled ? "Mute sound effects (M)" : "Unmute sound effects (M)"}
            title="Toggle sound (M)"
            ariaPressed={soundEnabled}
            tone="cyan"
          >
            {soundEnabled ? <Volume2 size={16} strokeWidth={2} /> : <VolumeX size={16} strokeWidth={2} />}
          </IconBtn>
          {inSession && (
            <>
              <IconBtn onClick={onRestart} ariaLabel="Restart session (R)" title="Restart (R)" tone="green">
                <RotateCcw size={16} strokeWidth={2} />
              </IconBtn>
              <IconBtn onClick={onExit} ariaLabel="Exit to main menu (Esc)" title="Exit (Esc)" tone="pink">
                <X size={16} strokeWidth={2} />
              </IconBtn>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function IconBtn({
  children, onClick, ariaLabel, title, ariaPressed, tone = "cyan",
}: {
  children: React.ReactNode; onClick: () => void; ariaLabel: string; title: string;
  ariaPressed?: boolean; tone?: "cyan" | "green" | "pink";
}) {
  const hover =
    tone === "green" ? "hover:border-neon hover:text-neon hover:shadow-neon"
    : tone === "pink" ? "hover:border-[var(--neon-pink)] hover:text-neon-pink hover:shadow-pink"
    : "hover:border-[var(--neon-cyan)] hover:text-neon-cyan";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      title={title}
      className={`focus-neon inline-flex h-8 w-8 items-center justify-center rounded border border-border/60 bg-card/40 text-muted-foreground backdrop-blur transition ${hover}`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`font-display font-bold ${color}`}>{value}</span>
    </div>
  );
}

function ConfirmExit({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") { e.preventDefault(); onConfirm(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onConfirm]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-exit-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-md border border-[var(--neon-pink)]/60 bg-card/95 p-6 text-center"
      >
        <h3 id="confirm-exit-title" className="font-display text-lg font-bold text-neon-pink">
          Exit session?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">Your current run will be lost.</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            autoFocus
            className="focus-neon flex-1 rounded border border-border/60 px-4 py-2 text-sm font-bold uppercase tracking-wider text-foreground transition hover:border-neon hover:text-neon"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="focus-neon flex-1 rounded border border-[var(--neon-pink)]/70 px-4 py-2 text-sm font-bold uppercase tracking-wider text-neon-pink transition hover:bg-secondary hover:text-secondary-foreground"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

function Intro({ onStart, best }: { onStart: () => void; best: number }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <h2 className="font-display text-4xl font-black leading-tight sm:text-6xl">
        <span className="text-neon">DECODE</span>
        <br />
        <span className="text-foreground">THE CODE.</span>
      </h2>
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">
        Read. Predict. Beat the timer.
      </p>

      <div className="mt-10 grid w-full max-w-md grid-cols-3 gap-3 text-xs">
        <Card label="ROUNDS" value={String(TOTAL_ROUNDS)} />
        <Card label="TIMER" value={`${ROUND_TIME}s`} />
        <Card label="BEST" value={String(best)} />
      </div>

      <button
        onClick={onStart}
        autoFocus
        className="focus-neon group relative mt-10 overflow-hidden rounded-md border border-neon bg-transparent px-10 py-4 font-display text-lg font-bold uppercase tracking-widest text-neon transition hover:bg-primary hover:text-primary-foreground"
      >
        <span className="relative z-10">▶ Start</span>
      </button>
    </section>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/60 bg-card/60 p-3 backdrop-blur">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function GameBoard({
  snippet, phase, time, picked, hintShown, round, total, onPick, onHint, onNext,
}: {
  snippet: Snippet; phase: Phase; time: number; picked: number | null; hintShown: boolean;
  round: number; total: number;
  onPick: (i: number) => void; onHint: () => void; onNext: () => void;
}) {
  const correct = picked !== null && picked === snippet.answer;
  const timeColor = time > 15 ? "text-neon" : time > 7 ? "text-neon-cyan" : "text-destructive";

  return (
    <section className="flex flex-1 flex-col gap-4" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          ROUND <span className="text-foreground">{round + 1}</span>/{total}
        </span>
        <span className="flex items-center gap-2">
          <Badge>{snippet.language}</Badge>
          <Badge tone={snippet.difficulty}>{snippet.difficulty}</Badge>
        </span>
        <span className={`font-display font-bold ${timeColor}`} aria-label={`Time remaining: ${time} seconds`}>
          ⏱ {String(time).padStart(2, "0")}s
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded bg-muted">
        <div
          className="h-full bg-gradient-to-r from-[var(--neon-green)] to-[var(--neon-pink)] transition-[width] duration-1000 ease-linear"
          style={{ width: `${(time / ROUND_TIME) * 100}%` }}
        />
      </div>

      <CodeBlock code={snippet.code} language={snippet.language} />

      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-base sm:text-lg">{snippet.question}</h3>
        <button
          onClick={onHint}
          disabled={hintShown || picked !== null}
          aria-label={`Reveal hint, costs ${HINT_COST} points (H)`}
          className="focus-neon shrink-0 rounded border border-secondary/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-neon-pink transition hover:bg-secondary/10 disabled:opacity-30"
        >
          ? hint -{HINT_COST}
        </button>
      </div>

      {hintShown && (
        <div className="rounded border border-secondary/40 bg-secondary/5 p-3 text-sm text-neon-pink" role="note">
          ▸ {snippet.hint}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Answer options">
        {snippet.options.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswer = i === snippet.answer;
          const reveal = picked !== null;
          const cls = reveal
            ? isAnswer
              ? "border-neon bg-primary/10 text-neon"
              : isPicked
                ? "border-destructive bg-destructive/5 text-destructive"
                : "border-border/30 opacity-40"
            : "border-border/60 hover:border-neon hover:bg-primary/5";
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isPicked}
              aria-label={`Option ${i + 1}: ${opt}${reveal && isAnswer ? " (correct)" : ""}`}
              disabled={picked !== null}
              onClick={() => onPick(i)}
              className={`focus-neon rounded border p-3 text-left text-sm transition ${cls}`}
            >
              <span className="mr-2 font-bold text-muted-foreground">[{String.fromCharCode(65 + i)}]</span>
              {opt}
            </button>
          );
        })}
      </div>

      {phase === "result" && (
        <div role="status" aria-live="assertive" className={`rounded border p-4 ${correct ? "border-neon bg-primary/5" : "border-destructive bg-destructive/5"}`}>
          <div className={`font-display text-lg font-bold ${correct ? "text-neon" : "text-destructive"}`}>
            {correct ? "✓ ACCESS GRANTED" : "✗ ACCESS DENIED"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{snippet.explanation}</p>
          <button
            onClick={onNext}
            autoFocus
            className="focus-neon mt-3 rounded border border-neon bg-primary/10 px-6 py-2 font-display text-sm font-bold uppercase tracking-wider text-neon transition hover:bg-primary hover:text-primary-foreground"
          >
            {round + 1 >= total ? "Finish ▸" : "Next ▸"}
          </button>
        </div>
      )}
    </section>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: string }) {
  const color =
    tone === "easy" ? "text-neon border-[var(--neon-green)]/50"
    : tone === "medium" ? "text-neon-cyan border-[var(--neon-cyan)]/50"
    : tone === "hard" ? "text-neon-pink border-[var(--neon-pink)]/50"
    : "text-muted-foreground border-border";
  return (
    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${color}`}>
      {children}
    </span>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const lines = useMemo(() => code.split("\n"), [code]);
  return (
    <div className="relative overflow-hidden rounded-md border border-border/60 bg-card/60 backdrop-blur">
      <div className="flex items-center justify-end border-b border-border/40 px-4 py-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          {language.toLowerCase()}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed sm:text-sm">
        <code className="font-mono">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 inline-block w-6 select-none text-right text-muted-foreground/60">
                {i + 1}
              </span>
              <span className="text-foreground">{line || " "}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function GameOver({ score, best, onRestart }: { score: number; best: number; onRestart: () => void }) {
  const newBest = score >= best && score > 0;
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <h2 className="font-display text-5xl font-black sm:text-6xl">
        <span className="text-foreground">COMPLETE</span>
      </h2>

      <div className="mt-8 rounded-md border border-neon/60 bg-card/60 px-12 py-6 backdrop-blur">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">score</div>
        <div className="font-display text-6xl font-black text-neon">{score}</div>
        {newBest && (
          <div className="mt-2 text-xs font-bold uppercase tracking-widest text-neon-pink">
            ⚡ new best
          </div>
        )}
      </div>

      <button
        onClick={onRestart}
        autoFocus
        className="focus-neon mt-10 rounded-md border bg-transparent px-10 py-4 font-display text-lg font-bold uppercase tracking-widest text-neon-pink transition hover:bg-secondary hover:text-secondary-foreground"
        style={{ borderColor: "var(--neon-pink)" }}
      >
        ▶ Play again
      </button>
    </section>
  );
}