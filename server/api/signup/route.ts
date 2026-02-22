import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|org|net)$/i;
  return emailRegex.test(email);
};

export async function POST(req: Request) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400 }
    );
  }

  if (username.trim().length < 3) {
    return new Response(
      JSON.stringify({ error: "Username must be at least 3 characters" }),
      { status: 400 }
    );
  }

  if (!validateEmail(email)) {
    return new Response(
      JSON.stringify({ error: "Email must end with @.com, @.org, or @.net" }),
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return new Response(
      JSON.stringify({ error: "Password must be at least 6 characters" }),
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("mydatabase");
  const users = db.collection("users");

  const existing = await users.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    return new Response(
      JSON.stringify({ error: "Email or username already exists" }),
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await users.insertOne({
    username,
    email,
    password: hashedPassword,
    createdAt: new Date(),
  });

  return new Response(JSON.stringify({ message: "User created successfully" }), {
    status: 201,
  });
}