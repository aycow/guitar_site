import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";

export async function GET() {
  const client = await clientPromise;
  const levels = await client.db().collection("levels").find({}).toArray();
  return NextResponse.json(levels);
}
