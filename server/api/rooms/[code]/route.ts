import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  // TODO: fetch room by params.code
  return NextResponse.json({ code: params.code });
}
