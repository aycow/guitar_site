import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // TODO: fetch level by params.id
  return NextResponse.json({ id: params.id });
}
