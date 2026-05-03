import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SNIPPETS, type Snippet } from "@/data/snippets";

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
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, phase, picked]);

  function start() {
    setDeck(shuffle(SNIPPETS).slice(0, TOTAL_ROUNDS));
    setRound(0);
    setScore(0);
    setStreak(0);
    setTime(ROUND_TIME);
    setPicked(null);
    setHintShown(false);
    setPhase("playing");
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
    } else {
      setStreak(0);
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
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundFX />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:px-6">
        <Header score={score} streak={streak} best={best} />

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
            onPick={lockAnswer}
            onHint={useHint}
            onNext={next}
          />
        )}

        {phase === "gameover" && <GameOver score={score} best={best} onRestart={start} />}

        <footer className="mt-auto pt-8 text-center text-xs text-muted-foreground">
          <span className="text-neon">[</span> CYBER-GUESSER <span className="text-neon-pink">v1.0</span> <span className="text-neon">]</span> — decode the matrix
        </footer>
      </div>
    </main>
  );
}

function BackgroundFX() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, oklch(0.7 0.28 330 / 0.2), transparent 50%), radial-gradient(ellipse at 80% 100%, oklch(0.85 0.25 145 / 0.18), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 3px, oklch(0 0 0 / 0.25) 3px, oklch(0 0 0 / 0.25) 4px)",
        }}
      />
    </>
  );
}

function Header({ score, streak, best }: { score: number; streak: number; best: number }) {
  return (
    <header className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
      <h1 className="font-display text-xl font-black sm:text-2xl">
        <span className="text-neon">CYBER</span>
        <span className="text-muted-foreground">_</span>
        <span className="text-neon-pink">GUESSER</span>
      </h1>
      <div className="flex gap-4 text-xs sm:text-sm">
        <Stat label="SCORE" value={score} color="text-neon" />
        <Stat label="STREAK" value={`x${streak}`} color="text-neon-pink" />
        <Stat label="BEST" value={best} color="text-neon-cyan" />
      </div>
    </header>
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

function Intro({ onStart, best }: { onStart: () => void; best: number }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <div className="mb-2 text-xs uppercase tracking-[0.4em] text-neon-cyan glitch-flicker">
        // initialize_session
      </div>
      <h2 className="font-display text-4xl font-black leading-tight sm:text-6xl">
        <span className="text-neon">DECODE</span>
        <br />
        <span className="text-foreground">THE CODE.</span>
      </h2>
      <p className="mt-6 max-w-md text-sm text-muted-foreground sm:text-base">
        Read the snippet. Predict the output. Beat the timer. Stack your streak.
        <span className="cursor-blink" />
      </p>

      <div className="mt-10 grid w-full max-w-md grid-cols-3 gap-3 text-xs">
        <Card label="ROUNDS" value={String(TOTAL_ROUNDS)} />
        <Card label="TIMER" value={`${ROUND_TIME}s`} />
        <Card label="BEST" value={String(best)} />
      </div>

      <button
        onClick={onStart}
        className="group relative mt-10 overflow-hidden rounded-md border-2 border-neon bg-primary/10 px-10 py-4 font-display text-lg font-bold uppercase tracking-widest text-neon shadow-neon transition hover:bg-primary hover:text-primary-foreground"
      >
        <span className="relative z-10">▶ Start_Run</span>
      </button>

      <p className="mt-6 text-xs text-muted-foreground">
        Languages: JS · Python · Kotlin · Rust · C · Go · SQL · Bash · TS
      </p>
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
    <section className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          ROUND <span className="text-foreground">{round + 1}</span>/{total}
        </span>
        <span className="flex items-center gap-2">
          <Badge>{snippet.language}</Badge>
          <Badge tone={snippet.difficulty}>{snippet.difficulty}</Badge>
        </span>
        <span className={`font-display font-bold ${timeColor}`}>
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
          className="shrink-0 rounded border border-secondary/50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-neon-pink transition hover:bg-secondary/10 disabled:opacity-30"
        >
          ? hint -{HINT_COST}
        </button>
      </div>

      {hintShown && (
        <div className="rounded border border-secondary/40 bg-secondary/5 p-3 text-sm text-neon-pink">
          ▸ {snippet.hint}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {snippet.options.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswer = i === snippet.answer;
          const reveal = picked !== null;
          const cls = reveal
            ? isAnswer
              ? "border-neon bg-primary/15 text-neon shadow-neon"
              : isPicked
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border/40 opacity-50"
            : "border-border hover:border-neon hover:bg-primary/5 hover:shadow-neon";
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => onPick(i)}
              className={`rounded border-2 p-3 text-left text-sm transition ${cls}`}
            >
              <span className="mr-2 font-bold text-muted-foreground">[{String.fromCharCode(65 + i)}]</span>
              {opt}
            </button>
          );
        })}
      </div>

      {phase === "result" && (
        <div className={`rounded border-2 p-4 ${correct ? "border-neon bg-primary/10" : "border-destructive bg-destructive/10"}`}>
          <div className={`font-display text-lg font-bold ${correct ? "text-neon" : "text-destructive"}`}>
            {correct ? "✓ ACCESS GRANTED" : "✗ ACCESS DENIED"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{snippet.explanation}</p>
          <button
            onClick={onNext}
            className="mt-3 rounded border border-neon bg-primary/10 px-6 py-2 font-display text-sm font-bold uppercase tracking-wider text-neon transition hover:bg-primary hover:text-primary-foreground"
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
    <div className="scanlines relative overflow-hidden rounded-lg border-2 border-border bg-card/80 shadow-neon backdrop-blur">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/80" />
          <span className="h-3 w-3 rounded-full bg-secondary/80" />
          <span className="h-3 w-3 rounded-full bg-primary/80" />
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {language.toLowerCase()}.src
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
      <div className="mb-2 text-xs uppercase tracking-[0.4em] text-neon-pink glitch-flicker">
        // session_terminated
      </div>
      <h2 className="font-display text-5xl font-black sm:text-7xl">
        <span className="text-neon-pink">RUN</span>{" "}
        <span className="text-foreground">COMPLETE</span>
      </h2>

      <div className="mt-8 rounded-lg border-2 border-neon bg-card/60 px-12 py-6 shadow-neon backdrop-blur">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">final_score</div>
        <div className="font-display text-6xl font-black text-neon">{score}</div>
        {newBest && (
          <div className="mt-2 text-sm font-bold uppercase tracking-widest text-neon-pink glitch-flicker">
            ⚡ new personal best
          </div>
        )}
      </div>

      <button
        onClick={onRestart}
        className="mt-10 rounded-md border-2 bg-secondary/10 px-10 py-4 font-display text-lg font-bold uppercase tracking-widest text-neon-pink shadow-pink transition hover:bg-secondary hover:text-secondary-foreground"
        style={{ borderColor: "var(--neon-pink)" }}
      >
        ▶ Run_Again
      </button>
    </section>
  );
}