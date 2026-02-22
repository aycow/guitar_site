import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Session } from "next-auth";

export async function getAuthSession(): Promise<Session | null> {
  try {
    const session = await getServerSession(authOptions);
    return session || null;
  } catch (error) {
    console.error("Error getting auth session:", error);
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id || "",
    email: session.user.email || "",
    name: session.user.name || "",
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getAuthSession();
  return !!session?.user;
}
