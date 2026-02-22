import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function POST(req: Request) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("guitar_academy");
    const users = db.collection("users");

    const existing = await users.findOne({ email });
    if (existing) {
      return new Response(JSON.stringify({ error: "User already exists" }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();
    const now = new Date();

    await users.insertOne({
      id: userId,
      name: username,
      email,
      password: hashedPassword,
      totalScore: 0,
      totalLevels: 0,
      bestAccuracy: 0,
      createdAt: now,
      updatedAt: now,
    });

    return new Response(JSON.stringify({ message: "User created successfully", userId }), { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(JSON.stringify({ error: "Failed to create user" }), { status: 500 });
  }
}