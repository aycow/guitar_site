"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shakeForm, setShakeForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorMessage("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage(res.error);
      } else {
        setErrorMessage("");
        alert("Login successful!");
        // You can redirect here using `useRouter()` if needed
      }
    } catch (error) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b">
      <h1 className="text-6xl font-bold text-white select-none mb-8 text-center">
        Welcome Back
      </h1>

      <p className="text-gray-300 mb-8 text-center">
        Log in to continue your guitar learning journey
      </p>

      <div className={`flex flex-col items-center justify-center space-y-4 ${shakeForm ? "animate-shake" : ""}`}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="w-72 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white disabled:opacity-50"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="w-72 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white disabled:opacity-50"
        />

        {errorMessage && (
          <p className="text-sm text-red-400 font-semibold text-center">{errorMessage}</p>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-red-600 text-white px-8 py-3 rounded-lg hover:scale-95 transform transition duration-200 disabled:opacity-50 disabled:hover:scale-100 font-semibold"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-gray-300 text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="text-red-400 hover:text-red-300 font-semibold">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}