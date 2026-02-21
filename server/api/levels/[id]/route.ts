import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("guitar_academy");
    const level = await db.collection("levels").findOne({ id: params.id });
    
    if (!level) {
      return NextResponse.json(
        { message: "Level not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(level);
  } catch (error) {
    console.error("Error fetching level:", error);
    return NextResponse.json(
      { message: "Failed to fetch level" },
      { status: 500 }
    );
  }
}
