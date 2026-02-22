// app/profile/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Score {
  id: string;
  levelId: string;
  score: number;
  accuracy: number;
  hits: number;
  misses: number;
  createdAt: string;
}

interface ProfileData {
  user: {
    id: string;
    username: string;
    email: string;
    totalScore: number;
    totalLevels: number;
    bestAccuracy: number;
    createdAt: string;
  };
  scores: Score[];
}

function getGrade(accuracy: number): { letter: string; color: string } {
  if (accuracy === 100) return { letter: "S", color: "#facc15" };
  if (accuracy >= 90)   return { letter: "A", color: "#22c55e" };
  if (accuracy >= 75)   return { letter: "B", color: "#60a5fa" };
  if (accuracy >= 60)   return { letter: "C", color: "#f97316" };
  return                       { letter: "D", color: "#ef4444" };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("[PROFILE] 🔒 Not logged in — redirecting to /login");
      router.push("/login?callbackUrl=/profile");
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    if (status !== "authenticated") return;

    console.log("[PROFILE] Fetching profile data for:", session?.user?.name);

    fetch("/api/profile")
      .then((res) => {
        console.log("[PROFILE] Response status:", res.status);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data: ProfileData) => {
        console.log("[PROFILE] ✅ Profile loaded:", data.user.username, "| scores:", data.scores.length);
        setProfile(data);
      })
      .catch((err) => {
        console.error("[PROFILE] ❌ Failed to load profile:", err);
        setError("Failed to load profile. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [status, session]);

  // ── Loading state ──
  if (status === "loading" || loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "rgba(0,0,0,0.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Courier New', monospace",
          color: "#f0f0f0",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #1f2937",
              borderTop: "3px solid #22c55e",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#6b7280", letterSpacing: 2, fontSize: 12 }}>LOADING PROFILE...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "rgba(0,0,0,0.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Courier New', monospace",
          color: "#f0f0f0",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>
          <Link href="/"><Button variant="ghost">← Home</Button></Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { user, scores } = profile;
  const avgAccuracy =
    scores.length > 0
      ? (scores.reduce((s, e) => s + e.accuracy, 0) / scores.length).toFixed(1)
      : "—";
  const bestScore = scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "rgba(0,0,0,0.92)",
        fontFamily: "'Courier New', monospace",
        color: "#f0f0f0",
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          borderBottom: "1px solid #1f2937",
          background: "#0d1117cc",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>🎸 GuitarGame</span>
          </Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/leaderboard"><Button variant="ghost" size="sm">Leaderboard</Button></Link>
            <button
              onClick={() => {
                console.log("[PROFILE] 🔴 Signing out:", user.username);
                void signOut({ callbackUrl: "/" });
              }}
              style={{
                background: "transparent",
                border: "1px solid #374151",
                borderRadius: 8,
                color: "#9ca3af",
                padding: "6px 14px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>

        {/* ── Profile Header ── */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #1f2937",
            borderRadius: 16,
            padding: "36px 40px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 200,
              height: 2,
              background: "linear-gradient(90deg, transparent, #22c55e, transparent)",
            }}
          />

          {/* Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 900,
              color: "#000",
              flexShrink: 0,
              boxShadow: "0 0 30px #22c55e40",
            }}
          >
            {user.username[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 3, marginBottom: 4 }}>
              PLAYER PROFILE
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f0f0f0", marginBottom: 4 }}>
              {user.username}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{user.email}</div>
            <div style={{ fontSize: 11, color: "#374151", marginTop: 6 }}>
              Joined {formatDate(user.createdAt)}
            </div>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: "TOTAL SCORE",   value: user.totalScore.toLocaleString(), color: "#facc15" },
            { label: "LEVELS PLAYED", value: user.totalLevels,                 color: "#60a5fa" },
            { label: "BEST SCORE",    value: bestScore.toLocaleString(),        color: "#22c55e" },
            { label: "AVG ACCURACY",  value: `${avgAccuracy}%`,                color: "#a78bfa" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: "#0d1117",
                border: "1px solid #1f2937",
                borderRadius: 10,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 10, color: "#6b7280", letterSpacing: 2, marginBottom: 6 }}>
                {label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ── Score History ── */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #1f2937",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 28px",
              borderBottom: "1px solid #1f2937",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 3 }}>HISTORY</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0", marginTop: 2 }}>
                Recent Scores
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#4b5563" }}>{scores.length} runs</div>
          </div>

          {scores.length === 0 ? (
            <div style={{ padding: "48px 28px", textAlign: "center" }}>
              <p style={{ color: "#4b5563", marginBottom: 16 }}>No scores yet — go play a song!</p>
              <Link href="/">
                <Button size="sm">Browse Songs →</Button>
              </Link>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 90px 90px 90px 110px",
                  padding: "10px 28px",
                  background: "#111827",
                  fontSize: 10,
                  color: "#6b7280",
                  letterSpacing: 2,
                }}
              >
                <span>LEVEL</span>
                <span>SCORE</span>
                <span>GRADE</span>
                <span>ACCURACY</span>
                <span>HITS / MISS</span>
                <span>DATE</span>
              </div>

              {scores.map((s, i) => {
                const grade = getGrade(s.accuracy);
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 120px 90px 90px 90px 110px",
                      padding: "14px 28px",
                      borderTop: "1px solid #1f2937",
                      background: i % 2 === 0 ? "transparent" : "#ffffff04",
                      alignItems: "center",
                      transition: "background 0.15s",
                    }}
                  >
                    {/* Level */}
                    <Link
                      href={`/game/${s.levelId}`}
                      style={{
                        color: "#f0f0f0",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {s.levelId}
                      <span style={{ color: "#374151", fontSize: 11, marginLeft: 6 }}>↗</span>
                    </Link>

                    {/* Score */}
                    <span style={{ color: "#facc15", fontWeight: 700, fontSize: 15 }}>
                      {s.score.toLocaleString()}
                    </span>

                    {/* Grade */}
                    <span
                      style={{
                        color: grade.color,
                        fontWeight: 900,
                        fontSize: 20,
                        textShadow: `0 0 12px ${grade.color}60`,
                      }}
                    >
                      {grade.letter}
                    </span>

                    {/* Accuracy */}
                    <div>
                      <div style={{ fontSize: 13, color: grade.color, fontWeight: 600 }}>
                        {s.accuracy.toFixed(1)}%
                      </div>
                      <div
                        style={{
                          height: 3,
                          background: "#1f2937",
                          borderRadius: 2,
                          marginTop: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${s.accuracy}%`,
                            background: grade.color,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>

                    {/* Hits / Misses */}
                    <span style={{ fontSize: 13 }}>
                      <span style={{ color: "#22c55e" }}>{s.hits}</span>
                      <span style={{ color: "#374151" }}> / </span>
                      <span style={{ color: "#ef4444" }}>{s.misses}</span>
                    </span>

                    {/* Date */}
                    <span style={{ color: "#4b5563", fontSize: 12 }}>
                      {formatDate(s.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}