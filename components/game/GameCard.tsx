"use client";

import type { Level } from "@/types/game";
import Image from "next/image";
import { Star, Music } from "lucide-react";

interface GameCardProps {
  level: Level;
  onPlay?: (levelId: string) => void;
}

export default function GameCard({ level, onPlay }: GameCardProps) {
  const difficultyMap = {
    easy: 1,
    medium: 2,
    hard: 3,
  };

  const stars = difficultyMap[level.difficulty || "easy"];
  const durationMinutes = level.durationMs ? Math.floor(level.durationMs / 60000) : 0;
  const durationSeconds = level.durationMs ? Math.floor((level.durationMs % 60000) / 1000) : 0;
  const durationString = `${durationMinutes}:${durationSeconds.toString().padStart(2, "0")}`;

  return (
    <div
      className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer h-full"
      onClick={() => onPlay?.(level.id)}
    >
      {/* Album Cover Background */}
      <div className="relative w-full h-48 bg-gradient-to-b from-blue-500 to-purple-600 overflow-hidden">
        {level.albumCover ? (
          <Image
            src={level.albumCover}
            alt={level.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 group-hover:from-blue-600 group-hover:to-purple-700 transition-all">
            <Music className="w-16 h-16 text-white/30" />
          </div>
        )}
        {/* Difficulty Badge */}
        <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-full flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < stars ? "fill-yellow-400 text-yellow-400" : "text-gray-500"}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title and Artist */}
        <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-300 transition-colors">
          {level.title}
        </h3>
        {level.artist && (
          <p className="text-sm text-gray-400 truncate mb-2">{level.artist}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3 mt-auto">
          <div className="flex gap-3">
            <span>♪ {level.bpm} BPM</span>
            <span>⏱ {durationString}</span>
          </div>
        </div>

        {/* Category Badge */}
        {level.category && (
          <div className="mb-3">
            <span className="inline-block bg-blue-500/40 text-blue-200 text-xs px-2 py-1 rounded-full">
              {level.category}
            </span>
          </div>
        )}

        {/* Play Button */}
        <button
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 group-hover:shadow-lg"
        >
          Play Now
        </button>
      </div>
    </div>
  );
}