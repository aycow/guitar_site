import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("mydatabase");
  const users = db.collection("users");

  const existing = await users.findOne({ email });
  if (existing) {
    return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await users.insertOne({ username, email, password: hashedPassword });

  return new Response(JSON.stringify({ message: "User created" }), { status: 201 });
}