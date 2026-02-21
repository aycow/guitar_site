import mongoose, { Schema, Document, model, models } from "mongoose";

// A single note in a level
export interface INote {
  targetHz: number;       // The exact frequency the player needs to hit
  noteName: string;       // Human-readable note name e.g. "A4", "E2"
  startMs: number;        // When this note starts in the song (milliseconds)
  durationMs: number;     // How long the player needs to hold it (milliseconds)
  string: number;         // Guitar string number 1–6 (for display purposes)
  fret: number;           // Fret number (for display purposes)
}

export interface ILevel extends Document {
  title: string;
  artist: string;
  difficulty: "easy" | "medium" | "hard";
  bpm: number;
  durationMs: number;     // Total song length in milliseconds
  notes: INote[];
  coverImageUrl?: string;
  audioUrl?: string;      // Optional backing track
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    targetHz: {
      type: Number,
      required: [true, "targetHz is required"],
      min: [20, "Frequency too low"],
      max: [20000, "Frequency too high"],
    },
    noteName: {
      type: String,
      required: [true, "noteName is required"],
      trim: true,
    },
    startMs: {
      type: Number,
      required: [true, "startMs is required"],
      min: [0, "startMs must be >= 0"],
    },
    durationMs: {
      type: Number,
      required: [true, "durationMs is required"],
      min: [1, "durationMs must be at least 1ms"],
    },
    string: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    fret: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
  },
  { _id: false } // Notes don't need their own _id
);

const LevelSchema = new Schema<ILevel>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    artist: {
      type: String,
      required: [true, "Artist is required"],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: ["easy", "medium", "hard"],
        message: "Difficulty must be easy, medium, or hard",
      },
      required: [true, "Difficulty is required"],
    },
    bpm: {
      type: Number,
      required: [true, "BPM is required"],
      min: [20, "BPM too low"],
      max: [300, "BPM too high"],
    },
    durationMs: {
      type: Number,
      required: [true, "durationMs is required"],
      min: [1000, "Level must be at least 1 second long"],
    },
    notes: {
      type: [NoteSchema],
      default: [],
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    audioUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Level = models.Level ?? model<ILevel>("Level", LevelSchema);
export default Level;