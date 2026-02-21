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
