"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          return { ok: false, error: result.error };
        }

        if (result?.ok) {
          router.push("/");
          return { ok: true };
        }

        return { ok: false, error: "Unknown error occurred" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Login failed";
        return { ok: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: true, callbackUrl: "/login" });
      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Logout failed";
      return { ok: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { ok: false, error: data.error || "Signup failed" };
        }

        return { ok: true, message: data.message };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Signup failed";
        return { ok: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    session,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading" || isLoading,
    user: session?.user,
    login,
    logout,
    signup,
  };
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (!isLoading && !isAuthenticated) {
    router.push("/login");
  }

  return { isAuthenticated, isLoading };
}
