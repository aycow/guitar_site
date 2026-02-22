// lib/auth.ts

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import type { Session } from "next-auth";

export async function getAuthSession(): Promise<Session | null> {
  console.log("[AUTH] getAuthSession() called");
  const session = await getServerSession(authOptions);
  if (session?.user) {
    console.log("[AUTH] ✅ Server session found for:", session.user.name);
  } else {
    console.log("[AUTH] 🔒 No server session");
  }
  return session;
}

// Re-export authOptions so anything that previously imported from here still works
export { authOptions };