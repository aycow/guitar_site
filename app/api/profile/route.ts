// app/api/profile/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import clientPromise from "@/server/db/client";
import { ObjectId } from "mongodb";

export async function GET() {
  console.log("[PROFILE] GET called");

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.warn("[PROFILE] ❌ Unauthenticated request");
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  console.log("[PROFILE] Fetching profile for userId:", session.user.id);

  try {
    const client = await clientPromise;
    const db = client.db("guitar_academy");

    // Fetch user document
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { password: 0 } } // never return the password
    );

    if (!user) {
      console.warn("[PROFILE] ❌ User not found:", session.user.id);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Fetch all scores for this user, most recent first
    const scores = await db
      .collection("scores")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    console.log("[PROFILE] ✅ Found user:", user.username, "| scores:", scores.length);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        totalScore: user.totalScore ?? 0,
        totalLevels: user.totalLevels ?? 0,
        bestAccuracy: user.bestAccuracy ?? 0,
        createdAt: user.createdAt,
      },
      scores: scores.map((s) => ({
        id: s._id.toString(),
        levelId: s.levelId,
        score: s.score,
        accuracy: s.accuracy,
        hits: s.hits,
        misses: s.misses,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("[PROFILE] ❌ Error:", error);
    return NextResponse.json({ message: "Failed to fetch profile" }, { status: 500 });
  }
}