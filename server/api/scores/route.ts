import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  // TODO: save score to DB
  return NextResponse.json({ ok: true });
}
