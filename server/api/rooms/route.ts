import { NextResponse } from "next/server";
import type { CreateRoomRequest } from "@/types/api";

export async function POST(req: Request) {
  const body: CreateRoomRequest = await req.json();
  const roomCode = Math.random().toString(36).slice(2, 7).toUpperCase();
  // TODO: save room to DB
  return NextResponse.json({ roomCode });
}
