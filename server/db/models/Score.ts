import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IScore extends Document {
  userId: mongoose.Types.ObjectId;
  levelId: mongoose.Types.ObjectId;
  roomCode?: string;          // null for solo play
  score: number;
  accuracy: number;           // 0–100 percentage
  perfectCount: number;
  goodCount: number;
  okCount: number;
  missCount: number;
  highestStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScoreSchema = new Schema<IScore>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
    },
    levelId: {
      type: Schema.Types.ObjectId,
      ref: "Level",
      required: [true, "levelId is required"],
    },
    roomCode: {
      type: String,
      default: null,
    },
    score: {
      type: Number,
      required: [true, "score is required"],
      min: 0,
    },
    accuracy: {
      type: Number,
      required: [true, "accuracy is required"],
      min: 0,
      max: 100,
    },
    perfectCount: { type: Number, default: 0, min: 0 },
    goodCount:    { type: Number, default: 0, min: 0 },
    okCount:      { type: Number, default: 0, min: 0 },
    missCount:    { type: Number, default: 0, min: 0 },
    highestStreak: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Index for fast leaderboard queries per level
ScoreSchema.index({ levelId: 1, score: -1 });
// Index for fast personal best queries
ScoreSchema.index({ userId: 1, levelId: 1 });

const Score = models.Score ?? model<IScore>("Score", ScoreSchema);
export default Score;   