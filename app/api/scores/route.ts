// app/api/scores/route.ts

import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";
import { ObjectId } from "mongodb";
import type { SubmitScoreRequest } from "@/types/api";

export async function GET(req: Request) {
  console.log("[SCORES] GET leaderboard called");

  try {
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("levelId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);

    const client = await clientPromise;
    const db = client.db("guitar_academy");

    const query: Record<string, unknown> = {};
    if (levelId) query.levelId = levelId;

    console.log("[SCORES] Querying scores with filter:", query);

    // Get best score per user
    const scores = await db
      .collection("scores")
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: "$userId",
            bestScore: { $max: "$score" },
            bestAccuracy: { $max: "$accuracy" },
            hits: { $first: "$hits" },
            misses: { $first: "$misses" },
            levelId: { $first: "$levelId" },
            createdAt: { $max: "$createdAt" },
          },
        },
        { $sort: { bestScore: -1, bestAccuracy: -1 } },
        { $limit: limit },
      ])
      .toArray();

    console.log("[SCORES] Found", scores.length, "score entries");

    // userId is stored as a string (the _id.toString() from auth)
    // so we need to convert back to ObjectId to look up users
    const userIds = scores.map((s) => {
      try {
        return new ObjectId(s._id as string);
      } catch {
        return null;
      }
    }).filter(Boolean) as ObjectId[];

    console.log("[SCORES] Looking up", userIds.length, "users");

    const users = await db
      .collection("users")
      .find({ _id: { $in: userIds } })
      .toArray();

    console.log("[SCORES] Found", users.length, "matching users");

    // Map _id (as string) → username
    const userMap = new Map(users.map((u) => [u._id.toString(), u.username as string]));

    const entries = scores.map((score, index) => {
      const userId = score._id as string;
      const playerName = userMap.get(userId) || "Unknown Player";

      if (playerName === "Unknown Player") {
        console.warn("[SCORES] ⚠️ Could not find username for userId:", userId);
      }

      return {
        rank: index + 1,
        userId,
        playerName,
        score: score.bestScore as number,
        accuracy: score.bestAccuracy as number,
        hits: score.hits as number,
        misses: score.misses as number,
        levelId: score.levelId as string,
        createdAt: (score.createdAt as Date)?.toISOString() ?? new Date().toISOString(),
      };
    });

    console.log("[SCORES] ✅ Returning", entries.length, "leaderboard entries");

    return NextResponse.json({ entries, totalPlayers: entries.length });
  } catch (error) {
    console.error("[SCORES] ❌ Error fetching leaderboard:", error);
    return NextResponse.json({ message: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  console.log("[SCORES] POST score submission called");

  try {
    const body: SubmitScoreRequest = await req.json();
    console.log("[SCORES] Incoming score:", body);

    if (!body.userId || !body.levelId || body.score === undefined) {
      console.warn("[SCORES] ❌ Missing required fields");
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("guitar_academy");

    const scoreDoc = {
      userId: body.userId,
      levelId: body.levelId,
      roomCode: body.roomCode,
      score: body.score,
      hits: body.hits,
      misses: body.misses,
      accuracy: body.accuracy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("scores").insertOne(scoreDoc);
    console.log("[SCORES] ✅ Score saved, id:", result.insertedId.toString());

    // Update user aggregate stats
    await db.collection("users").updateOne(
      { _id: new ObjectId(body.userId) },
      {
        $inc: { totalScore: body.score, totalLevels: 1 },
        $max: { bestAccuracy: body.accuracy },
        $set: { updatedAt: new Date() },
      }
    );

    console.log("[SCORES] ✅ User stats updated for userId:", body.userId);

    return NextResponse.json({ ok: true, message: "Score saved successfully" });
  } catch (error) {
    console.error("[SCORES] ❌ Error saving score:", error);
    return NextResponse.json({ message: "Failed to save score" }, { status: 500 });
  }
}