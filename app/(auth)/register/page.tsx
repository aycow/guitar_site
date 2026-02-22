"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shakeForm, setShakeForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (emailInput: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|org|net)$/i;
    return emailRegex.test(emailInput);
  };

  const handleRegister = async () => {
    setErrorMessage("");

    // Validation
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (username.trim().length < 3) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorMessage("Username must be at least 3 characters");
      return;
    }

    if (!validateEmail(email)) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorMessage("Email must end with @.com, @.org, or @.net");
      return;
    }

    if (password.length < 6) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorMessage("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage(data.error || "Registration failed");
        return;
      }

      alert("Registration successful! Please log in with your credentials.");
      router.push("/login");
    } catch (error) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", fontFamily: "'Courier New', monospace", color: "#f0f0f0" }}
    >
      <h1 style={{ fontFamily: "'Courier New', monospace" }} className="text-6xl font-bold select-none mb-8 text-center">
        Create Your Account
      </h1>

      <p className="text-zinc-300 mb-8 text-center">
        Join us and start your guitar learning journey
      </p>

      <div className={`flex flex-col items-center justify-center space-y-4 ${shakeForm ? "animate-shake" : ""}`}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          className="w-72 px-4 py-2 rounded-lg border border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white bg-[#061014] disabled:opacity-50"
        />

        <input
          type="email"
          placeholder="Email (must be .com, .org, or .net)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="w-72 px-4 py-2 rounded-lg border border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white bg-[#061014] disabled:opacity-50"
        />

        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="w-72 px-4 py-2 rounded-lg border border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white bg-[#061014] disabled:opacity-50"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          className="w-72 px-4 py-2 rounded-lg border border-[#1f2937] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white bg-[#061014] disabled:opacity-50"
        />

        {errorMessage && (
          <p className="text-sm text-amber-400 font-semibold text-center max-w-72">
            {errorMessage}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        <button
          onClick={handleRegister}
          disabled={loading}
          className="bg-emerald-500 text-black px-8 py-3 rounded-lg hover:scale-95 transform transition duration-200 disabled:opacity-50 disabled:hover:scale-100 font-semibold"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-zinc-300 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold">
            Log In
          </Link>
        </p>
      </div>
    </main>
  );
}
