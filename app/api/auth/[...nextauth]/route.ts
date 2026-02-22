import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        console.log("\n========== AUTH AUTHORIZE START ==========");
        console.log("🔐 Credentials provided:", {
          email: credentials?.email,
          passwordLength: credentials?.password?.length || 0,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password");
          throw new Error("Please provide both email and password");
        }

        try {
          console.log("\n1️⃣ Connecting to MongoDB...");
          const client = await clientPromise;
          console.log("✅ MongoDB client connected");

          const db = client.db("guitar-game");
          console.log("✅ Database selected: guitar_academy");

          const users = db.collection("users");
          console.log("✅ Users collection accessed");

          console.log("\n2️⃣ Searching for user with email:", credentials.email);
          const user = await users.findOne({ email: credentials.email });

          if (!user) {
            console.log("❌ No user found with email:", credentials.email);
            console.log("   Available users query: Check database directly");
            throw new Error("No account found with this email");
          }

          console.log("✅ User found:", {
            id: user.id,
            name: user.name,
            email: user.email,
            hasPassword: !!user.password,
          });

          console.log("\n3️⃣ Verifying password...");
          console.log("   Stored hash length:", user.password?.length || 0);
          console.log("   Provided password length:", credentials.password.length);

          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            console.log("❌ Password does not match");
            throw new Error("Incorrect password");
          }

          console.log("✅ Password matches");

          console.log("\n✅ AUTH AUTHORIZE COMPLETE - Success!");
          console.log("========== AUTH AUTHORIZE END ==========\n");

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.log("\n❌ AUTH ERROR");
          console.log("Error type:", error instanceof Error ? error.constructor.name : typeof error);
          console.log("Error message:", error instanceof Error ? error.message : String(error));
          console.log("========== AUTH AUTHORIZE END (ERROR) ==========\n");
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export const { GET, POST } = handler;
