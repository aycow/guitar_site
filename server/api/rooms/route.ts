import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";
import type { CreateRoomRequest } from "@/types/api";

export async function POST(req: Request) {
  try {
    const body: CreateRoomRequest = await req.json();
    
    // Validate required fields
    if (!body.levelId || !body.playerName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const roomCode = Math.random().toString(36).slice(2, 7).toUpperCase();
    
    const client = await clientPromise;
    const db = client.db("guitar_academy");
    
    // Create room document
    const roomDoc = {
      code: roomCode,
      levelId: body.levelId,
      creatorId: `user_${Date.now()}`, // Placeholder - should be actual user ID
      players: [
        {
          id: `user_${Date.now()}`,
          name: body.playerName,
          score: 0,
        },
      ],
      status: "waiting",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
    };
    
    await db.collection("rooms").insertOne(roomDoc);
    
    return NextResponse.json({ roomCode });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { message: "Failed to create room" },
      { status: 500 }
    );
  }
}
