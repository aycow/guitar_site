"use client";
import { useState, useMemo } from "react";
import GameCard from "@/components/game/GameCard";
import Select from "@/components/ui/Select";
import { GAME_MODE_OPTIONS, CATEGORY_OPTIONS } from "@/lib/game/gameModes";
import { mockLevels } from "@/lib/game/mockLevels";
import type { Level } from "@/types/game";
import { X } from "lucide-react";

export default function LevelSelectPage() {
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const filteredLevels = useMemo(() => {
    return mockLevels.filter((level) => {
      const matchMode = !selectedMode || level.difficulty === selectedMode;
      const matchCategory = !selectedCategory || level.category === selectedCategory;
      return matchMode && matchCategory;
    });
  }, [selectedMode, selectedCategory]);

  const handleClearFilters = () => {
    setSelectedMode("");
    setSelectedCategory("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Background Decoration */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Guitar Academy
          </h1>
          <p className="text-gray-400">Master your skills with our curated collection</p>
        </div>

        {/* Filter Section */}
        <div className="mb-8 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="mode-select"
              label="Difficulty Level"
              value={selectedMode}
              onChange={setSelectedMode}
              options={GAME_MODE_OPTIONS}
              placeholder="All difficulties"
              className="bg-gray-800 border-gray-700 text-white"
            />

            <Select
              id="category-select"
              label="Category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={CATEGORY_OPTIONS}
              placeholder="All categories"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Active Filters Display */}
          {(selectedMode || selectedCategory) && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-400">Active filters:</span>
              {selectedMode && (
                <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30">
                  <span>Difficulty: {selectedMode}</span>
                  <button
                    onClick={() => setSelectedMode("")}
                    className="hover:text-blue-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {selectedCategory && (
                <div className="flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                  <span>Category: {selectedCategory}</span>
                  <button
                    onClick={() => setSelectedCategory("")}
                    className="hover:text-purple-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <button
                onClick={handleClearFilters}
                className="text-xs text-gray-400 hover:text-gray-200 transition-colors underline ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-400">
          <p className="text-sm">
            Showing <span className="text-blue-400 font-semibold">{filteredLevels.length}</span> of{" "}
            <span className="font-semibold">{mockLevels.length}</span> lessons
          </p>
        </div>

        {/* Game Cards Grid */}
        {filteredLevels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLevels.map((level) => (
              <GameCard
                key={level.id}
                level={level}
                onPlay={(levelId) => {
                  console.log(`Playing level: ${levelId}`);
                  // TODO: Navigate to game page with levelId
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-block bg-gray-900/50 border border-gray-800 rounded-lg p-8">
              <p className="text-gray-400 text-lg mb-2">No lessons found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
