import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/server/db/client";
import Level from "@/server/db/models/Level";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    // Validate that the id is a valid MongoDB ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, message: "Invalid level ID" },
        { status: 400 }
      );
    }

    // Full level including the notes array (needed for actual gameplay)
    const level = await Level.findById(id).lean();

    if (!level) {
      return NextResponse.json(
        { ok: false, message: "Level not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: level });
  } catch (err) {
    console.error("[GET /api/levels/:id]", err);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch level" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, message: "Invalid level ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // TODO: add admin auth check here
    const updated = await Level.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }  // new: true returns the updated doc
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { ok: false, message: "Level not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (err: unknown) {
    console.error("[PATCH /api/levels/:id]", err);

    if (err instanceof Error && err.name === "ValidationError") {
      return NextResponse.json(
        { ok: false, message: err.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, message: "Failed to update level" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, message: "Invalid level ID" },
        { status: 400 }
      );
    }

    // TODO: add admin auth check here
    const deleted = await Level.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json(
        { ok: false, message: "Level not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "Level deleted" });
  } catch (err) {
    console.error("[DELETE /api/levels/:id]", err);
    return NextResponse.json(
      { ok: false, message: "Failed to delete level" },
      { status: 500 }
    );
  }
}