"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type SongItem = {
	id: string;
	title: string;
	subtitle?: string;
	chartPath?: string;
};

const SONGS: SongItem[] = [
	{ id: "g_scale", title: "G Scale", chartPath: "/audio/charts/g_scale.json" },
	{ id: "c_major_scale", title: "C Scale", chartPath: "/audio/charts/c_major_scale.json" },
	{ id: "apollo_brown_butter", title: "Butter — Apollo Brown", chartPath: "/audio/charts/apollo_brown_butter.json" },
];

export default function CampaignPage() {
	const router = useRouter();
	const [played, setPlayed] = useState<Record<string, boolean>>({});
	const [counts, setCounts] = useState<Record<string, number>>({});

	useEffect(() => {
		const p: Record<string, boolean> = {};
		const c: Record<string, number> = {};
		SONGS.forEach((s) => {
			try {
				const pv = localStorage.getItem(`played:${s.id}`);
				p[s.id] = pv === "true";
				const cnt = parseInt(localStorage.getItem(`playCount:${s.id}`) || "0", 10);
				c[s.id] = Number.isNaN(cnt) ? 0 : cnt;
			} catch (e) {
				p[s.id] = false;
				c[s.id] = 0;
			}
		});
		setPlayed(p);
		setCounts(c);
	}, []);

	const handlePlay = (song: SongItem) => {
		// increment play count and mark as played; unlocks next
		try {
			const key = `playCount:${song.id}`;
			const current = parseInt(localStorage.getItem(key) || "0", 10) || 0;
			localStorage.setItem(key, String(current + 1));
			localStorage.setItem(`played:${song.id}`, "true");
			setCounts((s) => ({ ...s, [song.id]: (s[song.id] || 0) + 1 }));
			setPlayed((p) => ({ ...p, [song.id]: true }));
		} catch (e) {
			// ignore
		}

		router.push(`/game/${song.id}`);
	};

	return (
		<main className="max-w-4xl mx-auto p-6">
			<h1 className="text-3xl font-bold text-white mb-4">Campaign</h1>
			<p className="text-gray-300 mb-6">Play through the songs in order. Unlock the next song by playing the previous one.</p>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				{SONGS.map((s, i) => {
					const isPlayed = !!played[s.id];
					const prevPlayed = i === 0 ? true : !!played[SONGS[i - 1].id];
					const locked = !prevPlayed;

					return (
						<Card key={s.id}>
							<div className="flex flex-col h-full">
								<div className="flex items-center justify-between mb-3">
									<div>
										<h3 className="text-lg font-semibold text-white">{s.title}</h3>
										{s.subtitle && <p className="text-sm text-gray-400">{s.subtitle}</p>}
									</div>
									<div className="text-sm text-gray-400">Plays: {counts[s.id] || 0}</div>
								</div>

								<div className="flex-1 flex items-center justify-center mb-4">
									<div className={`w-full h-32 rounded-md border border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center ${locked ? "opacity-60" : ""}`}>
										{locked ? (
											<div className="text-gray-500">Locked</div>
										) : (
											<div className="text-gray-300">Ready</div>
										)}
									</div>
								</div>

								<div className="flex gap-3">
									<Button
										onClick={() => handlePlay(s)}
										disabled={locked}
										className={locked ? "opacity-60 cursor-not-allowed" : ""}
									>
										Play
									</Button>
									<Button
										variant="ghost"
										onClick={() => {
											// allow manual marking for testing / demo
											try {
												localStorage.setItem(`played:${s.id}`, "true");
												setPlayed((p) => ({ ...p, [s.id]: true }));
											} catch (e) {}
										}}
									>
										Mark Complete
									</Button>
								</div>
							</div>
						</Card>
					);
				})}
			</div>
		</main>
	);
}

