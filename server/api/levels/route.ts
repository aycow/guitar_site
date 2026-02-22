import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("guitar_academy");
    const levels = await db.collection("levels").find({}).toArray();
    return NextResponse.json(levels);
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { message: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}
