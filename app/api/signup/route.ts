// app/api/signup/route.ts

import { NextResponse } from "next/server";
import clientPromise from "@/server/db/client";
import bcrypt from "bcryptjs";

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|org|net)$/i;
  return emailRegex.test(email);
};

export async function POST(req: Request) {
  console.log("[SIGNUP] POST request received");

  try {
    const { username, email, password } = await req.json();
    console.log("[SIGNUP] Fields received — username:", username, "| email:", email);

    if (!username || !email || !password) {
      console.warn("[SIGNUP] ❌ Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (username.trim().length < 3) {
      console.warn("[SIGNUP] ❌ Username too short:", username.trim().length);
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (!validateEmail(email)) {
      console.warn("[SIGNUP] ❌ Invalid email format:", email);
      return NextResponse.json({ error: "Email must end with .com, .org, or .net" }, { status: 400 });
    }

    if (password.length < 6) {
      console.warn("[SIGNUP] ❌ Password too short");
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    let client;
    try {
      client = await clientPromise;
      console.log("[SIGNUP] ✅ MongoDB connected");
    } catch (err) {
      console.error("[SIGNUP] ❌ MongoDB connection failed:", err);
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const db = client.db("guitar_academy");
    const users = db.collection("users");

    const existing = await users.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.trim() },
      ],
    });

    if (existing) {
      console.warn("[SIGNUP] ❌ Duplicate email or username:", email, username);
      return NextResponse.json({ error: "Email or username already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      totalScore: 0,
      totalLevels: 0,
      bestAccuracy: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("[SIGNUP] ✅ User created successfully — id:", result.insertedId.toString(), "| username:", username.trim());

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 });
  } catch (error) {
    console.error("[SIGNUP] ❌ Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}