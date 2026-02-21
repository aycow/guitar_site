#!/usr/bin/env bash
# ============================================================
#  Guitar Game – Project Restructure Script
#  Run from your project ROOT (same level as package.json)
#  Usage: bash restructure.sh
# ============================================================

set -e

echo "🎸 Restructuring guitar-game project..."

# ── 1. Delete old folders ────────────────────────────────────
rm -rf "app/client"
echo "🗑️  Deleted app/client/"
rm -rf "app/api"
echo "🗑️  Deleted app/api/"

# ── 2. Create all directories ────────────────────────────────
mkdir -p "app/(auth)/login"
mkdir -p "app/(auth)/register"
mkdir -p "app/game/[levelId]"
mkdir -p "app/lobby/[roomCode]"
mkdir -p "app/leaderboard"
mkdir -p components/audio
mkdir -p components/game
mkdir -p components/lobby
mkdir -p components/ui
mkdir -p lib/audio
mkdir -p lib/game
mkdir -p lib/socket
mkdir -p hooks
mkdir -p "server/api/auth/[...nextauth]"
mkdir -p "server/api/levels/[id]"
mkdir -p "server/api/rooms/[code]"
mkdir -p server/api/scores
mkdir -p server/socket/handlers
mkdir -p server/db/models
mkdir -p server/middleware
mkdir -p types
mkdir -p public/levels
echo "✅ Directories created"

# ── 3. Scaffold files ────────────────────────────────────────

# lib/audio/pitchDetection.ts
cat > lib/audio/pitchDetection.ts << 'EOF'
// Pure audio utility functions – extracted from InputTest.tsx

export function rmsDbfs(x: Float32Array) {
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    sum += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  const rms = Math.sqrt(sum / x.length);
  const db = 20 * Math.log10(rms + 1e-9);
  return { rms, db, peak };
}

export function autoCorrelatePitch(x: Float32Array, sampleRate: number) {
  const { rms } = rmsDbfs(x);
  if (rms < 0.01) return null;

  let mean = 0;
  for (let i = 0; i < x.length; i++) mean += x[i];
  mean /= x.length;

  const SIZE = x.length;
  const MIN_HZ = 80;
  const MAX_HZ = 1200;
  const maxLag = Math.floor(sampleRate / MIN_HZ);
  const minLag = Math.floor(sampleRate / MAX_HZ);

  let bestLag = -1;
  let bestCorr = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    let n1 = 0;
    let n2 = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      const a = x[i] - mean;
      const b = x[i + lag] - mean;
      corr += a * b;
      n1 += a * a;
      n2 += b * b;
    }
    corr /= Math.sqrt(n1 * n2) + 1e-12;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag === -1 || bestCorr < 0.55) return null;
  return { hz: sampleRate / bestLag, corr: bestCorr };
}
EOF

# lib/audio/noteMapping.ts
cat > lib/audio/noteMapping.ts << 'EOF'
const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export function hzToNoteName(hz: number): string {
  if (hz <= 0) return "—";
  const semitones = 12 * Math.log2(hz / 440) + 69;
  const midi = Math.round(semitones);
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}
EOF

# lib/game/scoring.ts
cat > lib/game/scoring.ts << 'EOF'
export type AccuracyRating = "PERFECT" | "GOOD" | "OK" | "MISS";

export function rateAccuracy(detectedHz: number, targetHz: number): AccuracyRating {
  if (targetHz === 0 || detectedHz === 0) return "MISS";
  const centsDiff = 1200 * Math.abs(Math.log2(detectedHz / targetHz));
  if (centsDiff < 10) return "PERFECT";
  if (centsDiff < 25) return "GOOD";
  if (centsDiff < 50) return "OK";
  return "MISS";
}

export function calcScore(rating: AccuracyRating, streak: number): number {
  const base = { PERFECT: 100, GOOD: 70, OK: 40, MISS: 0 }[rating];
  const multiplier = Math.min(1 + streak * 0.1, 3);
  return Math.round(base * multiplier);
}
EOF

# lib/game/levels.ts
cat > lib/game/levels.ts << 'EOF'
import type { Level } from "@/types/game";

export function getLevelDifficulty(level: Level): "easy" | "medium" | "hard" {
  if (level.bpm < 80) return "easy";
  if (level.bpm < 120) return "medium";
  return "hard";
}
EOF

# lib/socket/events.ts
cat > lib/socket/events.ts << 'EOF'
export const SOCKET_EVENTS = {
  JOIN_ROOM:    "room:join",
  LEAVE_ROOM:   "room:leave",
  ROOM_UPDATED: "room:updated",
  GAME_START:   "room:start",
  PITCH_UPDATE: "game:pitch",
  SCORE_UPDATE: "game:score",
  GAME_OVER:    "game:over",
} as const;
EOF

# hooks/useAudioCapture.ts
cat > hooks/useAudioCapture.ts << 'EOF'
"use client";
import { useEffect, useRef, useState } from "react";
import { rmsDbfs, autoCorrelatePitch } from "@/lib/audio/pitchDetection";

export interface AudioReadout {
  sampleRate: number;
  rms: number;
  db: number;
  peak: number;
  clipping: boolean;
  pitchHz: number;
  pitchConf: number;
}

const INITIAL_READOUT: AudioReadout = {
  sampleRate: 0, rms: 0, db: -120, peak: 0,
  clipping: false, pitchHz: 0, pitchConf: 0,
};

export function useAudioCapture(deviceId: string, active: boolean) {
  const [readout, setReadout] = useState<AudioReadout>(INITIAL_READOUT);
  const timeBuf = useRef(new Float32Array(2048));
  const freqBuf = useRef(new Uint8Array(1024));
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !deviceId) return;
    let cancelled = false;

    async function setup() {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

      streamRef.current = stream;
      const ctx = new AudioContext({ latencyHint: "interactive" });
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);

      const tick = () => {
        analyser.getFloatTimeDomainData(timeBuf.current);
        analyser.getByteFrequencyData(freqBuf.current);
        const { rms, db, peak } = rmsDbfs(timeBuf.current);
        const pitch = autoCorrelatePitch(timeBuf.current, ctx.sampleRate);
        setReadout({
          sampleRate: ctx.sampleRate, rms, db, peak,
          clipping: peak >= 0.99,
          pitchHz: pitch?.hz ?? 0,
          pitchConf: pitch?.corr ?? 0,
        });
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    setup().catch(console.error);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
      streamRef.current = null;
    };
  }, [active, deviceId]);

  return { readout, timeBuf: timeBuf.current, freqBuf: freqBuf.current };
}
EOF

# hooks/useGameSession.ts
cat > hooks/useGameSession.ts << 'EOF'
"use client";
import { useState } from "react";
import type { GameSession } from "@/types/game";

export function useGameSession() {
  const [session, setSession] = useState<GameSession | null>(null);
  // TODO: implement game state machine
  return { session, setSession };
}
EOF

# hooks/useSocket.ts
cat > hooks/useSocket.ts << 'EOF'
"use client";
import { useEffect, useRef } from "react";
// npm install socket.io-client
// import { io, Socket } from "socket.io-client";

export function useSocket(roomCode: string | null) {
  const socketRef = useRef<unknown>(null);

  useEffect(() => {
    if (!roomCode) return;
    // const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "");
    // socketRef.current = socket;
    // return () => { socket.disconnect(); };
  }, [roomCode]);

  return socketRef;
}
EOF

# types/game.ts
cat > types/game.ts << 'EOF'
export interface Note {
  id: string;
  targetHz: number;
  startMs: number;
  durationMs: number;
}

export interface Level {
  id: string;
  title: string;
  bpm: number;
  notes: Note[];
}

export interface Room {
  code: string;
  levelId: string;
  players: Player[];
  status: "waiting" | "playing" | "finished";
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameSession {
  roomCode: string;
  level: Level;
  players: Player[];
  startedAt: number;
}
EOF

# types/audio.ts
cat > types/audio.ts << 'EOF'
export interface PitchResult {
  hz: number;
  corr: number;
}

export interface AudioReadout {
  sampleRate: number;
  rms: number;
  db: number;
  peak: number;
  clipping: boolean;
  pitchHz: number;
  pitchConf: number;
}
EOF

# types/api.ts
cat > types/api.ts << 'EOF'
export interface ApiError {
  message: string;
  code?: string;
}

export interface CreateRoomRequest {
  levelId: string;
  playerName: string;
}

export interface CreateRoomResponse {
  roomCode: string;
}

export interface SubmitScoreRequest {
  roomCode: string;
  playerId: string;
  score: number;
}
EOF

# server/db/client.ts
cat > server/db/client.ts << 'EOF'
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";
if (!uri) throw new Error("Missing MONGODB_URI environment variable");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
EOF

cat > server/db/models/User.ts    << 'EOF'
// TODO: User model
EOF
cat > server/db/models/Level.ts   << 'EOF'
// TODO: Level model
EOF
cat > server/db/models/Room.ts    << 'EOF'
// TODO: Room model
EOF
cat > server/db/models/Score.ts   << 'EOF'
// TODO: Score model
EOF

# server/api routes
cat > server/api/levels/route.ts << 'EOF'
import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";

export async function GET() {
  const client = await clientPromise;
  const levels = await client.db().collection("levels").find({}).toArray();
  return NextResponse.json(levels);
}
EOF

cat > "server/api/levels/[id]/route.ts" << 'EOF'
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // TODO: fetch level by params.id
  return NextResponse.json({ id: params.id });
}
EOF

cat > server/api/rooms/route.ts << 'EOF'
import { NextResponse } from "next/server";
import type { CreateRoomRequest } from "@/types/api";

export async function POST(req: Request) {
  const body: CreateRoomRequest = await req.json();
  const roomCode = Math.random().toString(36).slice(2, 7).toUpperCase();
  // TODO: save room to DB
  return NextResponse.json({ roomCode });
}
EOF

cat > "server/api/rooms/[code]/route.ts" << 'EOF'
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  // TODO: fetch room by params.code
  return NextResponse.json({ code: params.code });
}
EOF

cat > server/api/scores/route.ts << 'EOF'
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  // TODO: save score to DB
  return NextResponse.json({ ok: true });
}
EOF

cat > "server/api/auth/[...nextauth]/route.ts" << 'EOF'
// npm install next-auth
// import NextAuth from "next-auth";
// export const { GET, POST } = NextAuth({ providers: [] });
export async function GET() { return new Response("Auth not configured yet"); }
export async function POST() { return new Response("Auth not configured yet"); }
EOF

cat > server/socket/index.ts << 'EOF'
// npm install socket.io
// Wire up in a custom server.ts or /api/socket route
import { SOCKET_EVENTS } from "@/lib/socket/events";
export { SOCKET_EVENTS };
EOF

cat > server/socket/handlers/roomHandlers.ts << 'EOF'
// TODO: handle JOIN_ROOM, LEAVE_ROOM, GAME_START socket events
EOF

cat > server/socket/handlers/gameHandlers.ts << 'EOF'
// TODO: handle PITCH_UPDATE, SCORE_UPDATE, GAME_OVER socket events
EOF

cat > server/middleware/authMiddleware.ts << 'EOF'
// TODO: validate session token on protected API routes
EOF

# components/audio
cat > components/audio/WaveformCanvas.tsx << 'EOF'
"use client";
// TODO: extract waveform canvas from InputTest.tsx into this component

export default function WaveformCanvas() {
  return <canvas />;
}
EOF

cat > components/audio/SpectrumCanvas.tsx << 'EOF'
"use client";
// TODO: extract spectrum canvas from InputTest.tsx into this component

export default function SpectrumCanvas() {
  return <canvas />;
}
EOF

cat > components/audio/PitchMeter.tsx << 'EOF'
"use client";

export default function PitchMeter() {
  return <div />;
}
EOF

# components/game
cat > components/game/NoteTimeline.tsx << 'EOF'
"use client";

export default function NoteTimeline() {
  return <div />;
}
EOF

cat > components/game/AccuracyFeedback.tsx << 'EOF'
"use client";

export default function AccuracyFeedback() {
  return <div />;
}
EOF

cat > components/game/ScoreBoard.tsx << 'EOF'
"use client";

export default function ScoreBoard() {
  return <div />;
}
EOF

cat > components/game/PlayerCard.tsx << 'EOF'
"use client";

export default function PlayerCard() {
  return <div />;
}
EOF

# components/lobby
cat > components/lobby/RoomCodeInput.tsx << 'EOF'
"use client";

export default function RoomCodeInput() {
  return <input />;
}
EOF

cat > components/lobby/PlayerList.tsx << 'EOF'
"use client";

export default function PlayerList() {
  return <ul />;
}
EOF

# components/ui
cat > components/ui/Button.tsx << 'EOF'
"use client";

export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props}>{children}</button>;
}
EOF

cat > components/ui/Card.tsx << 'EOF'
"use client";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-zinc-200 p-4">{children}</div>;
}
EOF

# app pages
cat > app/game/page.tsx << 'EOF'
"use client";

export default function LevelSelectPage() {
  return <main>Level Select</main>;
}
EOF

cat > "app/game/[levelId]/page.tsx" << 'EOF'
"use client";

export default function GamePage() {
  return <main>Game</main>;
}
EOF

cat > "app/lobby/[roomCode]/page.tsx" << 'EOF'
"use client";

export default function LobbyPage() {
  return <main>Lobby</main>;
}
EOF

cat > app/leaderboard/page.tsx << 'EOF'
"use client";

export default function LeaderboardPage() {
  return <main>Leaderboard</main>;
}
EOF

cat > "app/(auth)/login/page.tsx" << 'EOF'
"use client";

export default function LoginPage() {
  return <main>Login</main>;
}
EOF

cat > "app/(auth)/register/page.tsx" << 'EOF'
"use client";

export default function RegisterPage() {
  return <main>Register</main>;
}
EOF

# .env.local
if [ ! -f ".env.local" ]; then
cat > .env.local << 'EOF'
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/guitar-game
NEXTAUTH_SECRET=replace-me
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
EOF
  echo "✅ Created .env.local (fill in your values)"
fi

echo ""
echo "🎸 Done! Run: npm install mongodb socket.io socket.io-client next-auth"
echo ""
