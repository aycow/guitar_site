"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, isLoading } = useAuth();
  const [action, setAction] = useState("Log In");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypedPassword, setRetypedPassword] = useState("");
  const [shakeForm, setShakeForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAction = async () => {
    setErrorMessage("");

    if (action === "Sign Up") {
      // Sign up validation
      if (!username.trim()) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage("Username is required");
        return;
      }

      if (username.length < 2) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage("Username must be at least 2 characters");
        return;
      }

      if (!email.trim()) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage("Email is required");
        return;
      }

      if (password.length < 6) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage("Password must be at least 6 characters");
        return;
      }

      if (password !== retypedPassword) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage("Passwords do not match!");
        return;
      }

      const result = await signup(username, email, password);
      if (result.ok) {
        setErrorMessage("");
        alert("Sign up successful! Please log in with your credentials.");
        setAction("Log In");
        setUsername("");
        setPassword("");
        setRetypedPassword("");
      } else {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage(result.error || "Sign up failed");
      }
    } else {
      // Login validation
      if (!email.trim() || !password) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage("Please enter email and password");
        return;
      }

      const result = await login(email, password);
      if (!result.ok) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage(result.error || "Login failed");
      }
      // If login is successful, redirect happens automatically
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAction();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
      <h1 className="text-6xl font-bold text-white select-none mb-8 text-center">
        Welcome to Guitar Site
      </h1>

      <div className="space-x-4 mb-6">
        <button
          onClick={() => { setAction("Sign Up"); setErrorMessage(""); }}
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            action === "Sign Up"
              ? "bg-red-600 text-white"
              : "border-2 border-gray-300 bg-white text-black hover:bg-gray-100"
          } disabled:opacity-50`}
        >
          Sign Up
        </button>
        <button
          onClick={() => { setAction("Log In"); setErrorMessage(""); }}
          disabled={isLoading}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            action === "Log In"
              ? "bg-red-600 text-white"
              : "border-2 border-gray-300 bg-white text-black hover:bg-gray-100"
          } disabled:opacity-50`}
        >
          Log In
        </button>
      </div>

      <div className={`flex flex-col items-center justify-center space-y-3 w-72 ${shakeForm ? "animate-shake" : ""}`}>
        {action === "Sign Up" && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white disabled:opacity-50"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white disabled:opacity-50"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white disabled:opacity-50"
        />

        {action === "Sign Up" && (
          <input
            type="password"
            placeholder="Retype Password"
            value={retypedPassword}
            onChange={(e) => setRetypedPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white disabled:opacity-50"
          />
        )}

        {errorMessage && (
          <p className="text-sm text-red-400 font-semibold text-center mt-2">
            {errorMessage}
          </p>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={handleAction}
          disabled={isLoading}
          onKeyPress={handleKeyPress}
          className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transform transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isLoading ? "Loading..." : action}
        </button>
      </div>

      {action === "Log In" && (
        <p className="text-gray-400 text-sm mt-6">
          Don't have an account?{" "}
          <button
            onClick={() => setAction("Sign Up")}
            className="text-red-400 hover:text-red-300 font-semibold underline"
          >
            Create one
          </button>
        </p>
      )}
    </main>
  );
}
