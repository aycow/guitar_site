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
    <main className="flex min-h-screen flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", fontFamily: "'Courier New', monospace", color: "#f0f0f0" }}>
      <h1 className="text-6xl font-bold select-none mb-8 text-center font-mono tracking-wide">
        Welcome Back
      </h1>

      <p className="text-zinc-300 mb-8 text-center">
        Log in to continue your guitar learning journey
      </p>

      <div className={`flex flex-col items-center justify-center space-y-4 ${shakeForm ? "animate-shake" : ""}`}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="w-72 px-4 py-2 rounded-lg border border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white bg-[#061014] disabled:opacity-50"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="w-72 px-4 py-2 rounded-lg border border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white bg-[#061014] disabled:opacity-50"
        />

        {errorMessage && (
          <p className="text-sm text-amber-400 font-semibold text-center">{errorMessage}</p>
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

        <p className="text-zinc-300 text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="text-amber-400 hover:text-amber-300 font-semibold">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}