import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function POST(req: Request) {
  console.log("\n========== SIGNUP REQUEST START ==========");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  try {
    // Parse request
    console.log("1️⃣ Parsing request body...");
    const body = await req.json();
    console.log("📦 Request body:", body);

    const { username, email, password } = body;
    console.log("👤 Username:", username);
    console.log("📧 Email:", email);
    console.log("🔒 Password received:", !!password, `(Length: ${password?.length || 0})`);

    // Validate fields
    console.log("\n2️⃣ Validating required fields...");
    if (!username) {
      console.log("❌ Username is missing");
      return new Response(JSON.stringify({ error: "Username is required" }), { status: 400 });
    }
    if (!email) {
      console.log("❌ Email is missing");
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }
    if (!password) {
      console.log("❌ Password is missing");
      return new Response(JSON.stringify({ error: "Password is required" }), { status: 400 });
    }
    console.log("✅ All required fields present");

    // Validate email format
    console.log("\n3️⃣ Validating email format...");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return new Response(JSON.stringify({ error: "Invalid email format" }), { status: 400 });
    }
    console.log("✅ Email format valid");

    // Validate password length
    console.log("\n4️⃣ Validating password length...");
    if (password.length < 6) {
      console.log("❌ Password too short:", password.length, "< 6");
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), { status: 400 });
    }
    console.log("✅ Password length valid");

    // Connect to database
    console.log("\n5️⃣ Connecting to MongoDB...");
    console.log("   ⏳ Waiting for MongoDB connection at:", process.env.MONGODB_URI);
    console.log("   ⏳ Timeout: 30 seconds");

    let client;
    try {
      client = await clientPromise;
      console.log("✅ MongoDB client connected successfully");
    } catch (connectionError: any) {
      console.log("❌ MONGODB CONNECTION FAILED");
      console.log("   Error Code:", connectionError.code || "N/A");
      console.log("   Error Message:", connectionError.message);
      console.log("   Address:", connectionError.address || "N/A");
      console.log("   Port:", connectionError.port || "N/A");
      console.log("   Errno:", connectionError.errno || "N/A");
      console.log("   Syscall:", connectionError.syscall || "N/A");
      console.log("\n❌ FIX: Make sure MongoDB is running!");
      console.log("   Windows: mongod (in PowerShell/Command Prompt)");
      console.log("   Check: Is mongod process running? Use 'tasklist | findstr mongod' on Windows");
      throw connectionError;
    }

    const db = client.db("guitar-game");
    console.log("✅ Database selected: guitar_academy");

    const users = db.collection("users");
    console.log("✅ Users collection accessed");

    // Check if user exists
    console.log("\n6️⃣ Checking if user already exists...");
    console.log("   Searching for email:", email);
    const existing = await users.findOne({ email });
    if (existing) {
      console.log("❌ User already exists with this email");
      console.log("   Found user:", existing._id);
      return new Response(JSON.stringify({ error: "User already exists with this email" }), { status: 400 });
    }
    console.log("✅ Email is unique, no existing user found");

    // Hash password
    console.log("\n7️⃣ Hashing password...");
    console.log("   Salt rounds: 10");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed successfully");
    console.log("   Hash length:", hashedPassword.length);

    // Generate user ID
    console.log("\n8️⃣ Generating user ID...");
    const userId = generateId();
    console.log("✅ User ID generated:", userId);

    // Prepare user document
    console.log("\n9️⃣ Preparing user document...");
    const now = new Date();
    const userDocument = {
      id: userId,
      name: username,
      email: email,
      password: hashedPassword,
      totalScore: 0,
      totalLevels: 0,
      bestAccuracy: 0,
      createdAt: now,
      updatedAt: now,
    };
    console.log("📋 User document to insert:");
    console.log(JSON.stringify(userDocument, null, 2));

    // Insert user into database
    console.log("\n🔟 Inserting user into database...");
    console.log("   Database: guitar_academy");
    console.log("   Collection: users");
    const result = await users.insertOne(userDocument);
    console.log("✅ User inserted successfully");
    console.log("   Inserted ID:", result.insertedId);
    console.log("   Acknowledged:", result.acknowledged);

    // Verify insertion
    console.log("\n1️⃣1️⃣ Verifying user was created...");
    const verifyUser = await users.findOne({ id: userId });
    if (verifyUser) {
      console.log("✅ User verified in database");
      console.log("   Found user with ID:", verifyUser.id);
      console.log("   Email:", verifyUser.email);
    } else {
      console.log("⚠️ Warning: User not found after insertion");
    }

    // Return success
    console.log("\n✅ SIGNUP COMPLETE - Success!");
    console.log("========== SIGNUP REQUEST END ==========\n");

    return new Response(
      JSON.stringify({
        message: "User created successfully",
        userId,
        email
      }),
      { status: 201 }
    );
  } catch (error) {
    console.log("\n❌ ERROR OCCURRED");
    console.log("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.log("Error message:", error instanceof Error ? error.message : String(error));
    console.log("Full error:", error);
    console.log("========== SIGNUP REQUEST END (ERROR) ==========\n");

    return new Response(
      JSON.stringify({
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500 }
    );
  }
}
