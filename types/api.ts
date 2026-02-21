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
  roomCode?: string;
  userId: string;
  levelId: string;
  score: number;
  hits: number;
  misses: number;
  accuracy: number;
}

export interface SubmitScoreResponse {
  ok: boolean;
  message?: string;
}

export interface GetLevelResponse {
  id: string;
  title: string;
  artist?: string;
  bpm: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  durationMs?: number;
  albumCover?: string;
  notes: Array<{
    id: string;
    targetHz: number;
    startMs: number;
    durationMs: number;
  }>;
}
