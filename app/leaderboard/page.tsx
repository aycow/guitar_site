"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { LeaderboardEntry, GetLeaderboardResponse } from "@/types/api";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("");

  useEffect(() => {
    fetchLeaderboard();
  }, [levelFilter]);

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (levelFilter) {
        params.append("levelId", levelFilter);
      }
      params.append("limit", "100");

      const response = await fetch(`/api/scores?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data: GetLeaderboardResponse = await response.json();
      setLeaderboard(data.entries);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)", fontFamily: "'Courier New', monospace", color: "#f0f0f0" }}>
      {/* Navigation Bar */}
      <nav className="border-b border-[#1f2937] bg-[#0d1117]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-white hover:text-zinc-300 cursor-pointer font-mono">
              🎸 GuitarGame
            </h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/game/1">
              <Button variant="ghost">Play</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white mb-4 font-mono tracking-wide">🏆 Global Leaderboard</h2>
          <p className="text-xl text-zinc-300 mb-8">
            Compete with musicians worldwide. Top performers are ranked by score and accuracy.
          </p>

          {/* Level Filter */}
          <div className="flex gap-4 flex-wrap">
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
            <div className="flex items-end">
              <Button onClick={() => fetchLeaderboard()}>Refresh</Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <p className="text-zinc-400 mt-4">Loading leaderboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6 mb-8">
            <p className="text-red-300 font-semibold">Error: {error}</p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!loading && leaderboard.length > 0 && (
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      Player Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      Score
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      Accuracy
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      Hits
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      Misses
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr
                      key={`${entry.userId}-${entry.levelId}`}
                      className={`border-b border-zinc-700/50 transition-colors ${
                        index % 2 === 0 ? "bg-zinc-900/30" : "bg-zinc-800/20"
                      } hover:bg-zinc-700/30`}
                    >
                      <td className={`px-6 py-4 font-bold text-lg`}>
                        <span
                          className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-full
                          ${
                            entry.rank === 1
                              ? "bg-amber-500/30 text-amber-300"
                              : entry.rank === 2
                              ? "bg-gray-400/30 text-gray-300"
                              : entry.rank === 3
                              ? "bg-orange-600/30 text-orange-300"
                              : "bg-zinc-700/50 text-zinc-300"
                          }
                        `}
                        >
                          {entry.rank === 1 && "🥇"}
                          {entry.rank === 2 && "🥈"}
                          {entry.rank === 3 && "🥉"}
                          {entry.rank > 3 && entry.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {entry.playerName}
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-bold text-lg">
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-zinc-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full"
                              style={{ width: `${entry.accuracy}%` }}
                            ></div>
                          </div>
                          <span className="text-cyan-400 font-semibold">
                            {entry.accuracy.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-emerald-300">{entry.hits}</td>
                      <td className="px-6 py-4 text-red-400">{entry.misses}</td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && leaderboard.length === 0 && !error && (
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-12 text-center">
            <p className="text-zinc-400 text-lg mb-6">
              No scores yet! Be the first to play and reach the leaderboard.
            </p>
            <Link href="/game/1">
              <Button size="lg">Start Playing</Button>
            </Link>
          </div>
        )}

        {/* Stats Footer */}
        {!loading && leaderboard.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-6">
              <div className="text-sm text-emerald-300 mb-2">Total Players</div>
              <div className="text-3xl font-bold text-emerald-400">
                {leaderboard.length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 rounded-xl p-6">
              <div className="text-sm text-cyan-300 mb-2">Top Score</div>
              <div className="text-3xl font-bold text-cyan-400">
                {leaderboard[0]?.score.toLocaleString() || "—"}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-6">
              <div className="text-sm text-amber-300 mb-2">Avg Accuracy</div>
              <div className="text-3xl font-bold text-amber-400">
                {leaderboard.length > 0
                  ? (
                      leaderboard.reduce((sum, entry) => sum + entry.accuracy, 0) /
                      leaderboard.length
                    ).toFixed(1)
                  : "—"}
                %
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}