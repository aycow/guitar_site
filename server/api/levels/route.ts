import { NextResponse } from "next/server";
import { connectDB } from "@/server/db/client";
import Level from "@/server/db/models/Level";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Optional filters via query params
    // e.g. /api/levels?difficulty=easy&limit=10
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const query: Record<string, unknown> = {};
    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      query.difficulty = difficulty;
    }

    const levels = await Level.find(query)
      .select("-notes")        // Don't send the full note array in the list view
      .sort({ difficulty: 1, title: 1 })
      .limit(limit)
      .lean();                 // Returns plain JS objects instead of Mongoose docs (faster)

    return NextResponse.json({ ok: true, data: levels });
  } catch (err) {
    console.error("[GET /api/levels]", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch levels" },
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