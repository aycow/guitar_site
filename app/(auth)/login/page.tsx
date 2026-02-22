"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [action, setAction] = useState("Sign Up");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypedPassword, setRetypedPassword] = useState("");
  const [shakeForm, setShakeForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAction = async () => {
    setErrorMessage("");

    if (action === "Sign Up") {
      if (password !== retypedPassword) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage("Passwords do not match!");
        return;
      }

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage(data.error);
      } else {
        setErrorMessage("");
        alert("Sign Up successful! You can now log in.");
        setAction("Log In");
        setUsername("");
        setPassword("");
        setRetypedPassword("");
      }
    } else {
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
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b">
      <h1 className="text-6xl font-bold text-white select-none mb-8 text-center">
        Welcome to Guitar Site
      </h1>

      <div className="space-x-4 mb-3">
        <button
          onClick={() => { setAction("Sign Up"); setErrorMessage(""); }}
          className={`px-6 py-1 rounded-lg ${action === "Sign Up" ? "bg-gray-600 text-white" : "border-2 border-gray-300 bg-white text-black"}`}
        >
          Sign Up
        </button>
        <button
          onClick={() => { setAction("Log In"); setErrorMessage(""); }}
          className={`px-6 py-1 rounded-lg ${action === "Log In" ? "bg-gray-600 text-white" : "border-2 border-gray-300 bg-white text-black"}`}
        >
          Log In
        </button>
      </div>

      <div className={`flex flex-col items-center justify-center space-y-2 ${shakeForm ? "animate-shake" : ""}`}>
        {action === "Sign Up" && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-72 px-4 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-72 px-4 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-72 px-4 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white"
        />

        {action === "Sign Up" && (
          <input
            type="password"
            placeholder="Retype Password"
            value={retypedPassword}
            onChange={(e) => setRetypedPassword(e.target.value)}
            className="w-72 px-4 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white"
          />
        )}

        {errorMessage && <p className="text-sm text-red-800 font-semibold">{errorMessage}</p>}
      </div>

      <div className="mt-4">
        <button
          onClick={handleAction}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:scale-95 transform transition duration-200"
        >
          {action}
        </button>
      </div>

      <p className="text-gray-300 text-sm mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-red-400 hover:text-red-300 font-semibold">
          Register here
        </Link>
      </p>
    </main>
  );
}