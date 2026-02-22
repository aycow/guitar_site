import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    return NextResponse.json({
      ok: true,
      state: mongoose.connection.readyState, // 1 = connected
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}