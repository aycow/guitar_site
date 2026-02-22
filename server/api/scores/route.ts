import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";
import type { SubmitScoreRequest, GetLeaderboardRequest } from "@/types/api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("levelId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);

    const client = await clientPromise;
    const db = client.db("guitar_academy");

    let query: Record<string, unknown> = {};
    if (levelId) {
      query.levelId = levelId;
    }

    // Get all scores, sorted by score (descending) then by accuracy (descending)
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
        {
          $sort: { bestScore: -1, bestAccuracy: -1 },
        },
        { $limit: limit },
      ])
      .toArray();

    // Get user names
    const userIds = scores.map((s) => s._id);
    const users = await db
      .collection("users")
      .find({ id: { $in: userIds } })
      .toArray();

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const entries = scores.map((score, index) => ({
      rank: index + 1,
      userId: score._id,
      playerName: userMap.get(score._id) || "Unknown Player",
      score: score.bestScore,
      accuracy: score.bestAccuracy,
      hits: score.hits,
      misses: score.misses,
      levelId: score.levelId,
      createdAt: score.createdAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      entries,
      totalPlayers: entries.length,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { message: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body: SubmitScoreRequest = await req.json();
    
    // Validate required fields
    if (!body.userId || !body.levelId || body.score === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
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
    
    // Update user stats
    await db.collection("users").updateOne(
      { id: body.userId },
      {
        $inc: { totalScore: body.score, totalLevels: 1 },
        $max: { bestAccuracy: body.accuracy },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );
    
    return NextResponse.json({ ok: true, message: "Score saved successfully" });
  } catch (error) {
    console.error("Error saving score:", error);
    return NextResponse.json(
      { message: "Failed to save score" },
      { status: 500 }
    );
  }
}
