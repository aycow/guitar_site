// app/game/[levelId]/page.tsx
"use client";

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChartEvent = {
  timeMs: number;
  durationMs: number;
  notes: number[];
  velocity?: number;
  _scored?: boolean;
};

type Chart = {
  id: string;
  title: string;
  audioUrl: string;
  offsetMs: number;
  bpmHint?: number | null;
  events: ChartEvent[];
};

type NoteResult = "HIT" | "MISS";

type ScoredNote = {
  event: ChartEvent;
  result: NoteResult;
  detectedHz?: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const HIT_WINDOW_MS        = 150;   // ±150 ms timing window
const SUSTAIN_EXTEND_MS    = 0;     // extra ms past durationMs where a hit still counts
const PITCH_TOLERANCE_CENTS = 100;  // ±100 cents
const MIN_RMS              = 0.012; // silence gate
const PITCH_HISTORY_SIZE   = 7;     // median filter length
const PITCH_POLL_MS        = 33;    // ~30 Hz pitch detection rate (not every frame)
const UI_POLL_MS           = 50;    // ~20 Hz UI update rate

// ─── Helpers ──────────────────────────────────────────────────────────────────

function midiToHz(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToName(m: number) {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  return `${names[m % 12]}${Math.floor(m / 12) - 1}`;
}

// Wrap cents into [-600, +600] so octave wrapping is handled cleanly
function centsDistance(hzA: number, hzB: number) {
  const cents = 1200 * Math.log2(hzA / hzB);
  const wrapped = ((cents + 600) % 1200) - 600;
  return Math.abs(wrapped);
}

// Try detected pitch AND common harmonic candidates (÷2, ÷3, ÷4, ×2)
// Bass detectors often lock to 2nd/3rd harmonic instead of fundamental
function pitchMatchesRobust(hzDetected: number, hzExpected: number, tolCents: number) {
  const candidates = [
    hzDetected,
    hzDetected / 2,
    hzDetected / 3,
    hzDetected / 4,
    hzDetected * 2,
  ];
  const best = Math.min(...candidates.map((h) => centsDistance(h, hzExpected)));
  return best <= tolCents;
}

function getRms(buf: Float32Array<ArrayBuffer>) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
}

// Median of a small array without mutating it
function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Normalised autocorrelation — tuned for bass (35–1200 Hz)
function autoCorrelate(buf: Float32Array<ArrayBuffer>, sampleRate: number): number | null {
  if (getRms(buf) < MIN_RMS) return null;

  let mean = 0;
  for (let i = 0; i < buf.length; i++) mean += buf[i];
  mean /= buf.length;

  const SIZE = buf.length;
  const maxLag = Math.floor(sampleRate / 35);   // ~35 Hz floor (5-string low B ≈ 31 Hz)
  const minLag = Math.floor(sampleRate / 1200);

  let bestLag = -1, bestCorr = 0;
  for (let lag = minLag; lag <= Math.min(maxLag, SIZE - 1); lag++) {
    let corr = 0, n1 = 0, n2 = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      const a = buf[i] - mean;
      const b = buf[i + lag] - mean;
      corr += a * b;
      n1 += a * a;
      n2 += b * b;
    }
    corr /= Math.sqrt(n1 * n2) + 1e-12;
    if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
  }

  if (bestLag === -1 || bestCorr < 0.45) return null;
  return sampleRate / bestLag;
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg, border: "none", borderRadius: 8,
    padding: "10px 20px", color: "#fff", fontWeight: 700,
    fontSize: 14, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GamePage({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = use(params);

  const [chart,        setChart       ] = useState<Chart | null>(null);
  const [isPlaying,    setIsPlaying   ] = useState(false);
  const [micReady,     setMicReady    ] = useState(false);
  const [songTimeMs,   setSongTimeMs  ] = useState(0);
  const [score,        setScore       ] = useState(0);
  const [combo,        setCombo       ] = useState(0);
  const [maxCombo,     setMaxCombo    ] = useState(0);
  const [scoredNotes,  setScoredNotes ] = useState<ScoredNote[]>([]);
  const [detectedHz,   setDetectedHz  ] = useState<number | null>(null);
  const [feedback,     setFeedback    ] = useState<"HIT" | "MISS" | null>(null);
  const [audioInputs,  setAudioInputs ] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  // FIX 6: user-adjustable latency compensation
  const [inputLatencyMs, setInputLatencyMs] = useState(0);
  const [pitchHistoryCount, setPitchHistoryCount] = useState(0);

  const audioRef         = useRef<HTMLAudioElement | null>(null);
  const rafRef           = useRef<number | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const micCtxRef    = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  // FIX 3: 4096-sample buffer for more stable bass detection
  const micBufRef    = useRef<Float32Array<ArrayBuffer>>(
    new Float32Array(4096) as Float32Array<ArrayBuffer>
  );

  // FIX 3: pitch median filter — last N raw estimates
  const pitchHistoryRef = useRef<number[]>([]);

  // Throttle timers
  const lastPitchPollRef = useRef(0);
  const lastUiUpdateRef  = useRef(0);

  // Mutable score state (no stale closures in RAF)
  const scoreRef    = useRef(0);
  const comboRef    = useRef(0);
  const maxComboRef = useRef(0);
  const scoredRef   = useRef<ScoredNote[]>([]);

  // FIX 4: index pointer — never scan the whole event list every frame
  const nextIdxRef  = useRef(0);

  const inputLatencyMsRef = useRef(inputLatencyMs);
  useEffect(() => { inputLatencyMsRef.current = inputLatencyMs; }, [inputLatencyMs]);

  // ── Load chart ──
  useEffect(() => {
    (async () => {
      const res = await fetch(`/charts/${levelId}.json`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load chart: ${res.status}`);
      const data: Chart = await res.json();
      if (data.audioUrl.includes("REPLACE_ME") || !data.audioUrl.endsWith(".mp3")) {
        data.audioUrl = `/audio/${levelId}.mp3`;
      }
      data.events.forEach((e) => { e._scored = false; });
      setChart(data);
    })().catch(console.error);
  }, [levelId]);

  // ── Enumerate audio inputs (no auto getUserMedia — permission denied) ──
  const refreshAudioInputs = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    const inputs = all.filter((d) => d.kind === "audioinput");
    setAudioInputs(inputs);
    setSelectedDeviceId((prev) => prev || inputs[0]?.deviceId || "");
  }, []);

  useEffect(() => {
    void (async () => { await refreshAudioInputs(); })();
    const handler = () => void (async () => { await refreshAudioInputs(); })();
    navigator.mediaDevices?.addEventListener?.("devicechange", handler);
    return () => { navigator.mediaDevices?.removeEventListener?.("devicechange", handler); };
  }, [refreshAudioInputs]);

  // ── Clean up mic ──
  const stopMic = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    analyserRef.current  = null;
    const ctx = micCtxRef.current;
    micCtxRef.current = null;
    if (ctx) ctx.close().catch(() => {});
    setMicReady(false);
  }, []);

  useEffect(() => {
    return () => {
      stopMic();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [stopMic]);

  // ── Init mic ──
  const initMic = useCallback(async () => {
    try {
      if (audioInputs.length === 0) await refreshAudioInputs();
      stopMic();

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const ctx    = new AudioContext({ latencyHint: "interactive" });
      const source = ctx.createMediaStreamSource(stream);

      // Highpass at 20 Hz: cuts DC / sub-rumble, doesn't touch bass fundamentals
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 20;

      const analyser = ctx.createAnalyser();
      // FIX 3: 4096 fftSize → more cycles captured at low frequencies
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;

      source.connect(hp);
      hp.connect(analyser);

      micStreamRef.current = stream;
      micCtxRef.current    = ctx;
      analyserRef.current  = analyser;
      pitchHistoryRef.current = [];

      // Re-size mic buffer to match fftSize
      micBufRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;

      setMicReady(true);
      // Re-enumerate now that permission is granted so labels populate
      await refreshAudioInputs();
    } catch (e) {
      console.error("Mic init failed", e);
      alert(
        "Could not access the selected audio input.\n\n" +
        "Tips:\n• Open http://localhost:3000\n• Allow mic permission\n• Pick your USB interface"
      );
    }
  }, [audioInputs.length, refreshAudioInputs, selectedDeviceId, stopMic]);

  // ── Feedback flash ──
  const showFeedback = useCallback((type: "HIT" | "MISS") => {
    setFeedback(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 400);
  }, []);

  // ── Main game loop ──
  useEffect(() => {
    if (!chart) return;

    const tick = (now: number) => {
      const audio    = audioRef.current;
      const analyser = analyserRef.current;
      const micCtx   = micCtxRef.current;

      if (audio) {
        // FIX 1 & 2: single clamped game time used for both UI and scoring
        const tRawMs  = audio.currentTime * 1000
                        - (chart.offsetMs ?? 0)
                        - inputLatencyMsRef.current;
        const tGameMs = Math.max(0, tRawMs);

        // FIX 4: throttle UI state updates to ~20 Hz
        if (now - lastUiUpdateRef.current >= UI_POLL_MS) {
          lastUiUpdateRef.current = now;
          setSongTimeMs(tGameMs);
        }

        // FIX 4: throttle pitch detection to ~30 Hz
        let hz: number | null = null;
        if (analyser && micCtx && now - lastPitchPollRef.current >= PITCH_POLL_MS) {
          lastPitchPollRef.current = now;
          analyser.getFloatTimeDomainData(micBufRef.current);
          const raw = autoCorrelate(micBufRef.current, micCtx.sampleRate);

          // FIX 3: median filter — only update history when we get a reading
          if (raw !== null) {
            pitchHistoryRef.current.push(raw);
            if (pitchHistoryRef.current.length > PITCH_HISTORY_SIZE) {
              pitchHistoryRef.current.shift();
            }
            setPitchHistoryCount(pitchHistoryRef.current.length);
          }

          // Use median of history if we have enough samples, else latest raw
          hz = pitchHistoryRef.current.length >= 3
            ? median(pitchHistoryRef.current)
            : raw;

          if (now - lastUiUpdateRef.current < UI_POLL_MS) {
            // Only update Hz display alongside UI throttle
          } else {
            setDetectedHz(hz);
          }
          setDetectedHz(hz);
        }

        // FIX 4: index pointer — O(1) instead of scanning all events
        while (nextIdxRef.current < chart.events.length) {
          const ev = chart.events[nextIdxRef.current];

          if (ev._scored) { nextIdxRef.current++; continue; }

          const diff = tGameMs - ev.timeMs;

          // Too early — stop, nothing after this is ready either
          if (diff < -HIT_WINDOW_MS) break;

          // FIX 6: hit window extended by durationMs for sustained notes
          const hitEnd = HIT_WINDOW_MS + (ev.durationMs ?? 0) + SUSTAIN_EXTEND_MS;

          if (diff <= hitEnd) {
            // Inside window — attempt hit if we have a pitch reading
            if (hz !== null) {
              const expectedHz = midiToHz(ev.notes[0]);
              // FIX 3: harmonic-tolerant matching (÷2, ÷3, ÷4, ×2)
              if (pitchMatchesRobust(hz, expectedHz, PITCH_TOLERANCE_CENTS)) {
                ev._scored = true;
                const pts = 100 * (comboRef.current + 1);
                scoreRef.current  += pts;
                comboRef.current  += 1;
                if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
                const sn: ScoredNote = { event: ev, result: "HIT", detectedHz: hz };
                scoredRef.current = [...scoredRef.current, sn];
                setScoredNotes(scoredRef.current);
                setScore(scoreRef.current);
                setCombo(comboRef.current);
                setMaxCombo(maxComboRef.current);
                showFeedback("HIT");
                nextIdxRef.current++;
                continue;
              }
            }
            break; // still inside window but no hit yet — keep waiting
          }

          // Past window — MISS
          ev._scored = true;
          comboRef.current = 0;
          const sn: ScoredNote = { event: ev, result: "MISS" };
          scoredRef.current = [...scoredRef.current, sn];
          setScoredNotes(scoredRef.current);
          setCombo(0);
          showFeedback("MISS");
          nextIdxRef.current++;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [chart, showFeedback]);

  // ── Play / Pause ──
  const toggle = async () => {
    if (!chart) return;
    let a = audioRef.current;
    if (!a) { a = new Audio(chart.audioUrl); a.preload = "auto"; audioRef.current = a; }
    if (!isPlaying) { await a.play().catch(console.error); setIsPlaying(true); }
    else { a.pause(); setIsPlaying(false); }
  };

  // ── Restart ──
  const restart = () => {
    const a = audioRef.current;
    if (a) { a.currentTime = 0; if (isPlaying) a.play().catch(console.error); }
    chart?.events.forEach((e) => { e._scored = false; });
    nextIdxRef.current     = 0;
    scoreRef.current       = 0;
    comboRef.current       = 0;
    maxComboRef.current    = 0;
    scoredRef.current      = [];
    pitchHistoryRef.current = [];
    setScore(0); setCombo(0); setMaxCombo(0); setScoredNotes([]); setSongTimeMs(0);
  };

  // ── Derived stats ──
  const hits     = useMemo(() => scoredNotes.filter((n) => n.result === "HIT").length,  [scoredNotes]);
  const misses   = useMemo(() => scoredNotes.filter((n) => n.result === "MISS").length, [scoredNotes]);
  const accuracy = scoredNotes.length > 0 ? Math.round((hits / scoredNotes.length) * 100) : 100;

  const nextEvent = useMemo(() => {
    if (!chart) return null;
    return chart.events.find((e) => !e._scored && e.timeMs >= songTimeMs) ?? null;
  }, [chart, songTimeMs]);

  if (!chart) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0a0a0f", color:"#fff", fontFamily:"monospace" }}>
      Loading chart…
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f0f0f0", fontFamily:"'Courier New', monospace", padding:"24px" }}>

      {feedback && (
        <div style={{
          position:"fixed", top:"30%", left:"50%", transform:"translateX(-50%)",
          fontSize:72, fontWeight:900, pointerEvents:"none", zIndex:100, letterSpacing:4,
          color: feedback === "HIT" ? "#22c55e" : "#ef4444",
          textShadow:`0 0 40px ${feedback === "HIT" ? "#22c55e" : "#ef4444"}`,
          animation:"pop 0.4s ease-out forwards",
        }}>{feedback}</div>
      )}

      <style>{`@keyframes pop{0%{opacity:1;transform:translateX(-50%) scale(1.2)}100%{opacity:0;transform:translateX(-50%) scale(0.9)}}`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"baseline", gap:16, marginBottom:24 }}>
        <h1 style={{ fontSize:28, fontWeight:700, margin:0, letterSpacing:2, textTransform:"uppercase" }}>{chart.title}</h1>
        {chart.bpmHint && <span style={{ fontSize:13, color:"#666", letterSpacing:1 }}>{Math.round(chart.bpmHint)} BPM</span>}
      </div>

      {/* Score cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"SCORE",     value:score.toLocaleString(), color:"#facc15" },
          { label:"COMBO",     value:`×${combo}`,            color:combo > 4 ? "#22c55e" : "#f0f0f0" },
          { label:"ACCURACY",  value:`${accuracy}%`,         color:accuracy >= 80 ? "#22c55e" : accuracy >= 50 ? "#facc15" : "#ef4444" },
          { label:"MAX COMBO", value:`×${maxCombo}`,         color:"#60a5fa" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:8, padding:"12px 16px" }}>
            <div style={{ fontSize:10, color:"#6b7280", letterSpacing:2, marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:24, fontWeight:700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Hit / Miss */}
      <div style={{ display:"flex", gap:12, marginBottom:24 }}>
        <div style={{ background:"#14532d", border:"1px solid #166534", borderRadius:8, padding:"8px 20px", fontSize:14, color:"#22c55e" }}>
          ✓ {hits} HIT{hits !== 1 ? "S" : ""}
        </div>
        <div style={{ background:"#7f1d1d", border:"1px solid #991b1b", borderRadius:8, padding:"8px 20px", fontSize:14, color:"#ef4444" }}>
          ✗ {misses} MISS{misses !== 1 ? "ES" : ""}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:12, color:"#9ca3af" }}>Input</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            style={{ background:"#0a0a0f", color:"#f0f0f0", border:"1px solid #374151", borderRadius:6, padding:"6px 8px", fontSize:12, maxWidth:280 }}
          >
            {audioInputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Audio Input (${d.deviceId.slice(0, 6)}…)`}
              </option>
            ))}
          </select>
          <button onClick={() => void refreshAudioInputs()} style={{ ...btnStyle("#374151"), padding:"6px 10px", fontSize:11 }}>Refresh</button>
          {micReady && <button onClick={() => void initMic()} style={{ ...btnStyle("#3b82f6"), padding:"6px 10px", fontSize:11 }}>Apply</button>}
        </div>

        {!micReady && <button onClick={() => void initMic()} style={btnStyle("#3b82f6")}>🎙 Enable Input</button>}
        {micReady  && <button onClick={stopMic}              style={btnStyle("#ef4444")}>⏹ Stop Input</button>}
        <button onClick={toggle}  style={btnStyle(isPlaying ? "#f59e0b" : "#22c55e")}>{isPlaying ? "⏸ Pause" : "▶ Play"}</button>
        <button onClick={restart} style={btnStyle("#6b7280")}>↺ Restart</button>

        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#111827", border:"1px solid #1f2937", borderRadius:8, padding:"8px 14px", fontSize:13 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:micReady ? "#22c55e" : "#374151", boxShadow:micReady ? "0 0 8px #22c55e" : "none" }} />
          <span style={{ color:"#9ca3af" }}>{micReady ? "Input active" : "Input off"}</span>
        </div>
      </div>

      {/* FIX 1: Latency calibration slider */}
      <div style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:8, padding:"12px 16px", marginBottom:24, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ fontSize:10, color:"#6b7280", letterSpacing:2, whiteSpace:"nowrap" }}>INPUT LATENCY</div>
        <input
          type="range" min={-200} max={200} step={5}
          value={inputLatencyMs}
          onChange={(e) => setInputLatencyMs(Number(e.target.value))}
          style={{ flex:1, accentColor:"#60a5fa" }}
        />
        <div style={{ fontSize:14, fontWeight:700, color:"#60a5fa", minWidth:60, textAlign:"right" }}>
          {inputLatencyMs > 0 ? "+" : ""}{inputLatencyMs} ms
        </div>
        <button onClick={() => setInputLatencyMs(0)} style={{ ...btnStyle("#374151"), padding:"4px 10px", fontSize:11 }}>Reset</button>
        <div style={{ fontSize:11, color:"#4b5563", maxWidth:200 }}>
          If notes feel late, drag left. If early, drag right.
        </div>
      </div>

      {/* Pitch monitor */}
      <div style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:8, padding:"16px", marginBottom:24, display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <div style={{ fontSize:10, color:"#6b7280", letterSpacing:2, marginBottom:6 }}>YOU&apos;RE PLAYING</div>
          <div style={{ fontSize:22, fontWeight:700, color:detectedHz ? "#60a5fa" : "#374151" }}>
            {detectedHz ? `${detectedHz.toFixed(1)} Hz` : "—"}
          </div>
          {detectedHz && (
            <div style={{ fontSize:11, color:"#4b5563", marginTop:2 }}>
              median of {Math.min(pitchHistoryCount, PITCH_HISTORY_SIZE)} samples
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize:10, color:"#6b7280", letterSpacing:2, marginBottom:6 }}>NEXT NOTE</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#f0f0f0" }}>
            {nextEvent ? `${midiToName(nextEvent.notes[0])} (${midiToHz(nextEvent.notes[0]).toFixed(1)} Hz)` : "—"}
          </div>
          {nextEvent && (
            <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>
              in {Math.max(0, Math.round(nextEvent.timeMs - songTimeMs))} ms
              {nextEvent.durationMs > 0 && ` · hold ${nextEvent.durationMs} ms`}
            </div>
          )}
        </div>
      </div>

      {/* Recent notes */}
      {scoredNotes.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:10, color:"#6b7280", letterSpacing:2, marginBottom:8 }}>RECENT NOTES</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[...scoredNotes].reverse().slice(0, 12).map((n, i) => (
              <div key={i} style={{
                background: n.result === "HIT" ? "#14532d" : "#7f1d1d",
                border:`1px solid ${n.result === "HIT" ? "#166534" : "#991b1b"}`,
                borderRadius:6, padding:"4px 10px", fontSize:12,
                color: n.result === "HIT" ? "#22c55e" : "#ef4444",
              }}>
                {midiToName(n.event.notes[0])}
                {n.detectedHz && <span style={{ color:"#6b7280", marginLeft:4 }}>{n.detectedHz.toFixed(0)}Hz</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize:12, color:"#374151" }}>{Math.max(0, Math.round(songTimeMs))} ms</div>
    </div>
  );
}