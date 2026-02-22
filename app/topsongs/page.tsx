"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type SongItem = { id: string; title: string };

const SONGS: SongItem[] = [
	{ id: "g_scale", title: "G Scale" },
	{ id: "c_major_scale", title: "C Scale" },
	{ id: "apollo_brown_butter", title: "Butter — Apollo Brown" },
];

export default function TopSongsPage() {
	const [counts, setCounts] = useState<Record<string, number>>({});

	useEffect(() => {
		const c: Record<string, number> = {};
		SONGS.forEach((s) => {
			try {
				const cnt = parseInt(localStorage.getItem(`playCount:${s.id}`) || "0", 10);
				c[s.id] = Number.isNaN(cnt) ? 0 : cnt;
			} catch (e) {
				c[s.id] = 0;
			}
		});
		setCounts(c);
	}, []);

	const sorted = [...SONGS].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));

	return (
		<main className="max-w-3xl mx-auto p-6">
			<h1 className="text-3xl font-bold text-white mb-4">Top Songs</h1>
			<p className="text-gray-300 mb-6">Shows the most frequently played songs (local play counts).</p>

			<div className="space-y-4">
				{sorted.map((s, i) => (
					<Card key={s.id}>
						<div className="flex items-center justify-between">
							<div>
								<div className="text-lg font-semibold text-white">{s.title}</div>
								<div className="text-sm text-gray-400">Rank #{i + 1}</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="text-sm text-gray-300">Plays: {counts[s.id] || 0}</div>
								<Button
									onClick={() => {
										try {
											const key = `playCount:${s.id}`;
											const current = parseInt(localStorage.getItem(key) || "0", 10) || 0;
											localStorage.setItem(key, String(current + 1));
											setCounts((prev) => ({ ...prev, [s.id]: (prev[s.id] || 0) + 1 }));
										} catch (e) {}
									}}
								>
									+1 Play
								</Button>
							</div>
						</div>
					</Card>
				))}
			</div>
		</main>
	);
}

