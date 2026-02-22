"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

type SongItem = { id: string; title: string };

type RecentPlay = {
    userId: string | null;
    userName: string;
    userImage?: string | null;
};

type SongPlayData = {
    _id: string;
    count: number;
    lastPlayed: string;
    recentPlays: RecentPlay[];
};

const SONGS: SongItem[] = [
    { id: "g_scale", title: "G Scale" },
    { id: "c_major_scale", title: "C Scale" },
    { id: "apollo_brown_butter", title: "Butter — Apollo Brown" },
];

export default function TopSongsPage() {
    const [songData, setSongData] = useState<Record<string, SongPlayData>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlayCounts = async () => {
            try {
                console.log("[TOPSONGS] Fetching play data...");
                const res = await fetch("/api/song-plays");

                if (!res.ok) {
                    throw new Error(`Failed to fetch plays: ${res.status}`);
                }

                const data = await res.json();
                console.log("[TOPSONGS] Fetched data:", data);

                const dataMap: Record<string, SongPlayData> = {};

                // Initialize all songs
                SONGS.forEach((s) => {
                    dataMap[s.id] = {
                        _id: s.id,
                        count: 0,
                        lastPlayed: new Date().toISOString(),
                        recentPlays: [],
                    };
                });

                // Update with actual data from MongoDB
                if (data.plays && Array.isArray(data.plays)) {
                    data.plays.forEach((play: SongPlayData) => {
                        if (dataMap.hasOwnProperty(play._id)) {
                            dataMap[play._id] = play;
                        }
                    });
                }

                setSongData(dataMap);
                setError(null);
                setLoading(false);
            } catch (error) {
                console.error("[TOPSONGS] Error fetching play data:", error);
                setError(String(error));

                // Fall back to empty state
                const dataMap: Record<string, SongPlayData> = {};
                SONGS.forEach((s) => {
                    dataMap[s.id] = {
                        _id: s.id,
                        count: 0,
                        lastPlayed: new Date().toISOString(),
                        recentPlays: [],
                    };
                });
                setSongData(dataMap);
                setLoading(false);
            }
        };

        fetchPlayCounts();

        // Refresh data every 10 seconds
        const interval = setInterval(fetchPlayCounts, 10000);
        return () => clearInterval(interval);
    }, []);

    const sorted = [...SONGS].sort(
        (a, b) => (songData[b.id]?.count || 0) - (songData[a.id]?.count || 0)
    );

    if (loading) {
        return (
            <main className="max-w-3xl mx-auto p-6">
                <h1 className="text-3xl font-bold text-white mb-4">Top Songs</h1>
                <p className="text-gray-300 mb-6">Loading...</p>
            </main>
        );
    }

    return (
        <main className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-white mb-4">Top Songs</h1>
            <p className="text-gray-300 mb-6">Shows the most frequently played songs. See who's been playing recently.</p>

            {error && (
                <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded">
                    Debug: {error}
                </div>
            )}

            <div className="space-y-4">
                {sorted.map((s, i) => {
                    const data = songData[s.id];
                    const recentPlayers = data?.recentPlays || [];

                    return (
                        <div
                            key={s.id}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="text-lg font-semibold text-white">{s.title}</div>
                                    <div className="text-sm text-gray-400">
                                        Rank #{i + 1} • {data?.count || 0} plays
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 ml-4">
                                    {/* Recent Players Avatars */}
                                    <div className="flex -space-x-2">
                                        {recentPlayers.length > 0 ? (
                                            recentPlayers.map((player, idx) => (
                                                <div
                                                    key={`${s.id}-${idx}`}
                                                    className="relative w-10 h-10 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center hover:z-10 transition-transform hover:scale-110 flex-shrink-0"
                                                    title={player.userName}
                                                >
                                                    {player.userImage ? (
                                                        <Image
                                                            src={player.userImage}
                                                            alt={player.userName}
                                                            width={40}
                                                            height={40}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                                            {player.userName?.charAt(0).toUpperCase() || "?"}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-gray-400">No plays yet</div>
                                        )}
                                    </div>

                                    {/* More indicator */}
                                    {recentPlayers.length > 5 && (
                                        <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                            +{recentPlayers.length - 5}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}

