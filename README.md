# 🎮 Cyber Guesser

A fast-paced coding quiz game for developers. Read a code snippet, predict what it does, beat the 30-second timer.

Built with React, TypeScript, and Capacitor - runs in the browser and as a native Android app.

## How it works

Each round shows you a real code snippet. Pick the correct answer before time runs out. Stay on a streak to multiply your score. Use hints if you're stuck - but they cost you 50 points.

- **7 rounds** per session
- **30 seconds** per round  
- **3 difficulty levels** - Easy, Medium, Hard
- **120+ questions** across 11 languages

## Languages covered

JavaScript · TypeScript · Python · C · C++ · SQL · Bash · CSS · HTML · Assembly · VHDL

## Tech stack

- React + TypeScript
- Vite — web build
- TanStack Router — routing
- Tailwind CSS — styling
- Capacitor — Android wrapper
- prism-react-renderer — syntax highlighting

## Running locally

```bash
npm install
npm run dev
```

## Building for Android

```bash
npm run build:mobile
cp dist/mobile/index.mobile.html dist/mobile/index.html
npx cap sync android
cd android
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
./gradlew assembleDebug
```

## License

MIT
