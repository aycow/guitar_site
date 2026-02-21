"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FallingNotes from "@/components/game/FallingNotes";
import { mockLevels } from "@/lib/game/mockLevels";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface GameStats {
  hits: number;
  misses: number;
  score: number;
  accuracy: number;
}

export default function GamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = params.levelId as string;

  const level = mockLevels.find((l) => l.id === levelId);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);

  if (!level) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Level not found</h1>
          <Link href="/game" className="text-blue-400 hover:text-blue-300">
            ← Back to levels
          </Link>
        </div>
      </div>
    );
  }

  const handleGameEnd = (stats: GameStats) => {
    setGameEnded(true);
    setFinalStats(stats);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Background Decoration */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/game"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              Back to Levels
            </Link>
            <h1 className="text-4xl font-bold text-white">{level.title}</h1>
            {level.artist && <p className="text-gray-400 mt-1">{level.artist}</p>}
          </div>
        </div>

        {/* Game Canvas */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
          <FallingNotes level={level} onGameEnd={handleGameEnd} />
        </div>

        {/* Level Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">BPM</div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{level.bpm}</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Difficulty</div>
            <div className="text-2xl font-bold text-purple-400 mt-1 capitalize">{level.difficulty}</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Notes</div>
            <div className="text-2xl font-bold text-green-400 mt-1">{level.notes.length}</div>
          </div>
        </div>

        {/* Game End Modal */}
        {gameEnded && finalStats && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">🎉 Level Complete!</h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Accuracy</div>
                  <div className="text-2xl font-bold text-blue-400 mt-1">{finalStats.accuracy.toFixed(1)}%</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Score</div>
                  <div className="text-2xl font-bold text-yellow-400 mt-1">{finalStats.score}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Hits</div>
                  <div className="text-2xl font-bold text-green-400 mt-1">{finalStats.hits}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Misses</div>
                  <div className="text-2xl font-bold text-red-400 mt-1">{finalStats.misses}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setGameEnded(false);
                    setFinalStats(null);
                    window.location.reload();
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Play Again
                </button>
                <Link
                  href="/game"
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors text-center"
                >
                  Back to Levels
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
