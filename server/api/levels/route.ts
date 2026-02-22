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

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    // TODO: add admin auth check here before allowing level creation
    const level = await Level.create(body);

    return NextResponse.json({ ok: true, data: level }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/levels]", err);

    // Return mongoose validation errors in a readable format
    if (err instanceof Error && err.name === "ValidationError") {
      return NextResponse.json(
        { ok: false, message: err.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Failed to create level" },
      { status: 500 }
    );
  }
}