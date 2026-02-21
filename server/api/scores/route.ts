import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";
import type { SubmitScoreRequest } from "@/types/api";

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
