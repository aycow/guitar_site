import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("guitar_academy");
    const room = await db.collection("rooms").findOne({ code: params.code });
    
    if (!room) {
      return NextResponse.json(
        { message: "Room not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { message: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const body = await req.json();
    
    const client = await clientPromise;
    const db = client.db("guitar_academy");
    
    const result = await db.collection("rooms").updateOne(
      { code: params.code },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Room not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ ok: true, message: "Room updated successfully" });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { message: "Failed to update room" },
      { status: 500 }
    );
  }
}
