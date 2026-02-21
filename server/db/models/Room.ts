import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IRoomPlayer {
  userId: mongoose.Types.ObjectId;
  username: string;
  score: number;
  streak: number;
  isReady: boolean;
  isConnected: boolean;
}

export interface IRoom extends Document {
  code: string;                               // Short join code e.g. "ABC12"
  levelId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  players: IRoomPlayer[];
  status: "waiting" | "playing" | "finished";
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoomPlayerSchema = new Schema<IRoomPlayer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    isReady: {
      type: Boolean,
      default: false,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const RoomSchema = new Schema<IRoom>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 5,
      maxlength: 5,
    },
    levelId: {
      type: Schema.Types.ObjectId,
      ref: "Level",
      required: [true, "Level is required"],
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host is required"],
    },
    players: {
      type: [RoomPlayerSchema],
      default: [],
      validate: {
        validator: (players: IRoomPlayer[]) => players.length <= 4,
        message: "A room can have at most 4 players",
      },
    },
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    startedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-expire finished rooms after 24 hours
RoomSchema.index({ finishedAt: 1 }, { expireAfterSeconds: 86400, sparse: true });

const Room = models.Room ?? model<IRoom>("Room", RoomSchema);
export default Room;