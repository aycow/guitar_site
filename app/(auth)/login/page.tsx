"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
<<<<<<< Updated upstream
=======
  const router = useRouter();
  const { login, signup, isLoading } = useAuth();
  const [action, setAction] = useState("Sign Up");
  const [username, setUsername] = useState("");
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    try {
      setLoading(true);
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
=======
      if (username.length < 2) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage("Username must be at least 2 characters");
        return;
      }

      if (password.length < 6) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage("Password must be at least 6 characters");
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
>>>>>>> Stashed changes
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorMessage(result.error || "Sign up failed");
      }
<<<<<<< Updated upstream
    } catch (error) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
=======
    } else {
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
>>>>>>> Stashed changes
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
      <h1 className="text-6xl font-bold text-white select-none mb-8 text-center">
        Welcome Back
      </h1>

<<<<<<< Updated upstream
      <p className="text-gray-300 mb-8 text-center">
        Log in to continue your guitar learning journey
      </p>
=======
      <div className="space-x-4 mb-3">
        <button
          onClick={() => { setAction("Sign Up"); setErrorMessage(""); }}
          disabled={isLoading}
          className={`px-6 py-1 rounded-lg transition-all ${
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
          className={`px-6 py-1 rounded-lg transition-all ${
            action === "Log In"
              ? "bg-red-600 text-white"
              : "border-2 border-gray-300 bg-white text-black hover:bg-gray-100"
          } disabled:opacity-50`}
        >
          Log In
        </button>
      </div>

      <div className={`flex flex-col items-center justify-center space-y-2 w-72 ${shakeForm ? "animate-shake" : ""}`}>
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
>>>>>>> Stashed changes

      <div className={`flex flex-col items-center justify-center space-y-4 ${shakeForm ? "animate-shake" : ""}`}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
<<<<<<< Updated upstream
          disabled={loading}
          className="w-72 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white disabled:opacity-50"
=======
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-black bg-white disabled:opacity-50"
>>>>>>> Stashed changes
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
<<<<<<< Updated upstream
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
=======
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
>>>>>>> Stashed changes
        </button>

<<<<<<< Updated upstream
        <p className="text-gray-300 text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="text-red-400 hover:text-red-300 font-semibold">
            Create one
          </Link>
        </p>
      </div>
=======
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
>>>>>>> Stashed changes
    </main>
  );
}
