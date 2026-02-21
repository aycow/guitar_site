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
