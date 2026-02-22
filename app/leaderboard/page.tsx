// app/leaderboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { LeaderboardEntry, GetLeaderboardResponse } from "@/types/api";

function getGrade(accuracy: number): { letter: string; color: string } {
  if (accuracy === 100) return { letter: "S", color: "#facc15" };
  if (accuracy >= 90)   return { letter: "A", color: "#22c55e" };
  if (accuracy >= 75)   return { letter: "B", color: "#60a5fa" };
  if (accuracy >= 60)   return { letter: "C", color: "#f97316" };
  return                       { letter: "D", color: "#ef4444" };
}

function PlayerAvatar({
  name,
  color,
  avatarUrl,
  size = 36,
}: {
  name: string;
  color?: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const bg = color ?? "#374151";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: avatarUrl ? "transparent" : bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 900,
        color: "#000",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: `0 0 10px ${bg}40`,
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        name[0].toUpperCase()
      )}
    </div>
  );
}

const rankBadge: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading,     setLoading    ] = useState(true);
  const [error,       setError      ] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [hoveredRow,  setHoveredRow ] = useState<number | null>(null);

  useEffect(() => { void fetchLeaderboard(); }, [levelFilter]);

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (levelFilter) params.append("levelId", levelFilter);
      params.append("limit", "100");

      const res = await fetch(`/api/scores?${params}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");

      const data = await res.json() as GetLeaderboardResponse;
      setLeaderboard(data.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const topScore    = leaderboard[0]?.score ?? 0;
  const avgAccuracy =
    leaderboard.length > 0
      ? (
          leaderboard.reduce((s, e) => s + e.accuracy, 0) / leaderboard.length
        ).toFixed(1)
      : "—";

  return (
    <main
      className="min-h-screen"
      style={{
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(8px)",
        fontFamily: "'Courier New', monospace",
        color: "#f0f0f0",
      }}
    >
      {/* ── Navbar ── */}
      <nav className="border-b border-[#1f2937] bg-[#0d1117]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-white hover:text-zinc-300 cursor-pointer font-mono">
              🎸 Guitarverse
            </h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/game/g_scale">
              <Button variant="ghost">Play</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* ── Header ── */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-white mb-3 font-mono tracking-wide">
            🏆 Global Leaderboard
          </h2>
          <p className="text-zinc-400 mb-8">
            Click any player to view their full profile.
          </p>

          <div className="flex gap-4 flex-wrap items-end">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                Filter by Level
              </label>
              <input
                type="text"
                placeholder="Level ID (leave empty for all)"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-[#0b1114] border border-[#1f2937] rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Button onClick={() => void fetchLeaderboard()}>Refresh</Button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            <p className="text-zinc-400 mt-4">Loading leaderboard...</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6 mb-8">
            <p className="text-red-300 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* ── Top 3 Podium ── */}
        {!loading && leaderboard.length >= 3 && (
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, podiumIdx) => {
              if (!entry) return null;
              const isFirst = entry.rank === 1;
              const colors: Record<number, string> = {
                1: "#facc15",
                2: "#9ca3af",
                3: "#f97316",
              };
              const accentColor = colors[entry.rank] ?? "#6b7280";
              const grade = getGrade(entry.accuracy);
              return (
                <Link
                  key={entry.userId}
                  href={`/profile/${entry.playerName}`}
                  style={{
                    flex: podiumIdx === 1 ? "1.2" : "1",
                    minWidth: 200,
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      background: "#0d1117",
                      border: `1px solid ${accentColor}40`,
                      borderRadius: 12,
                      padding: podiumIdx === 1 ? "24px 20px" : "18px 20px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "transform 0.15s, border-color 0.15s",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "translateY(-3px)";
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        accentColor;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "";
                      (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}40`;
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 120,
                        height: 2,
                        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                      }}
                    />
                    <div style={{ fontSize: 28, marginBottom: 10 }}>
                      {rankBadge[entry.rank]}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <PlayerAvatar
                        name={entry.playerName}
                        color={entry.avatarColor}
                        avatarUrl={entry.avatarUrl}
                        size={isFirst ? 56 : 44}
                      />
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: isFirst ? 17 : 15,
                        color: "#f0f0f0",
                        marginBottom: 4,
                      }}
                    >
                      {entry.playerName}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: accentColor,
                        marginBottom: 2,
                      }}
                    >
                      {entry.score.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: grade.color }}>
                      {entry.accuracy.toFixed(1)}% acc
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Full Table ── */}
        {!loading && leaderboard.length > 0 && (
          <div
            style={{
              background: "#0d1117",
              border: "1px solid #1f2937",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 140px 160px 80px 80px 110px",
                padding: "12px 24px",
                background: "#111827",
                fontSize: 10,
                color: "#6b7280",
                letterSpacing: 2,
                borderBottom: "1px solid #1f2937",
              }}
            >
              <span>RANK</span>
              <span>PLAYER</span>
              <span>SCORE</span>
              <span>ACCURACY</span>
              <span>HITS</span>
              <span>MISS</span>
              <span>DATE</span>
            </div>

            {leaderboard.map((entry, index) => {
              const grade = getGrade(entry.accuracy);
              const isHovered = hoveredRow === index;
              const isTop3 = entry.rank <= 3;

              return (
                <Link
                  key={`${entry.userId}-${entry.levelId}`}
                  href={`/profile/${entry.playerName}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "60px 1fr 140px 160px 80px 80px 110px",
                      padding: "14px 24px",
                      borderTop: "1px solid #1f2937",
                      background: isHovered
                        ? "#1f2937"
                        : index % 2 === 0
                        ? "transparent"
                        : "#ffffff03",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                  >
                    {/* Rank */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isTop3 ? (
                        <span style={{ fontSize: 20 }}>
                          {rankBadge[entry.rank]}
                        </span>
                      ) : (
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: "#1f2937",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            color: "#6b7280",
                            fontWeight: 700,
                          }}
                        >
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Player */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <PlayerAvatar
                        name={entry.playerName}
                        color={entry.avatarColor}
                        avatarUrl={entry.avatarUrl}
                        size={36}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: isHovered ? "#22c55e" : "#f0f0f0",
                            transition: "color 0.1s",
                          }}
                        >
                          {entry.playerName}
                        </div>
                        {isHovered && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "#4b5563",
                              letterSpacing: 1,
                              marginTop: 1,
                            }}
                          >
                            VIEW PROFILE →
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <span
                      style={{
                        color: "#facc15",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {entry.score.toLocaleString()}
                    </span>

                    {/* Accuracy */}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: "#1f2937",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${entry.accuracy}%`,
                            background: `linear-gradient(90deg, ${grade.color}80, ${grade.color})`,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          color: grade.color,
                          fontWeight: 700,
                          fontSize: 13,
                          minWidth: 44,
                          textAlign: "right",
                        }}
                      >
                        {entry.accuracy.toFixed(1)}%
                      </span>
                    </div>

                    {/* Hits */}
                    <span style={{ color: "#22c55e", fontSize: 13 }}>
                      {entry.hits}
                    </span>

                    {/* Misses */}
                    <span style={{ color: "#ef4444", fontSize: 13 }}>
                      {entry.misses}
                    </span>

                    {/* Date */}
                    <span style={{ color: "#4b5563", fontSize: 12 }}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && leaderboard.length === 0 && !error && (
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-12 text-center">
            <p className="text-zinc-400 text-lg mb-6">
              No scores yet — be the first!
            </p>
            <Link href="/game/g_scale">
              <Button size="lg">Start Playing</Button>
            </Link>
          </div>
        )}

        {/* ── Stats Footer ── */}
        {!loading && leaderboard.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: "Total Players",
                value: leaderboard.length,
                color: "emerald",
              },
              {
                label: "Top Score",
                value: topScore.toLocaleString(),
                color: "cyan",
              },
              {
                label: "Avg Accuracy",
                value: `${avgAccuracy}%`,
                color: "amber",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className={`bg-gradient-to-br from-${color}-500/10 to-${color}-600/5 border border-${color}-500/30 rounded-xl p-6`}
              >
                <div className={`text-sm text-${color}-300 mb-2`}>{label}</div>
                <div className={`text-3xl font-bold text-${color}-400`}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}