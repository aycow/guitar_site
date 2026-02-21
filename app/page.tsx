"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Status = "OFF" | "READY" | "CAPTURING" | "STOPPED" | "ERROR";

function rmsDbfs(x: Float32Array) {
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    sum += v * v;
    const a = Math.abs(v);
    if (a > peak) peak = a;
  }
  const rms = Math.sqrt(sum / x.length);
  const db = 20 * Math.log10(rms + 1e-9);
  return { rms, db, peak };
}

function autoCorrelatePitch(x: Float32Array, sampleRate: number) {
  const { rms } = rmsDbfs(x);
  if (rms < 0.01) return null;

  let mean = 0;
  for (let i = 0; i < x.length; i++) mean += x[i];
  mean /= x.length;

  const SIZE = x.length;

  const MIN_HZ = 80;
  const MAX_HZ = 1200;
  const maxLag = Math.floor(sampleRate / MIN_HZ);
  const minLag = Math.floor(sampleRate / MAX_HZ);

  let bestLag = -1;
  let bestCorr = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    let n1 = 0;
    let n2 = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      const a = x[i] - mean;
      const b = x[i + lag] - mean;
      corr += a * b;
      n1 += a * a;
      n2 += b * b;
    }
    corr /= Math.sqrt(n1 * n2) + 1e-12;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag === -1 || bestCorr < 0.55) return null;

  const hz = sampleRate / bestLag;
  return { hz, corr: bestCorr };
}

export default function InputTestPage() {
  const [status, setStatus] = useState<Status>("OFF");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");

  const [readout, setReadout] = useState({
    sampleRate: 0,
    rms: 0,
    db: -120,
    peak: 0,
    clipping: false,
    pitchHz: 0,
    pitchConf: 0,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const timeBuf = useMemo(() => new Float32Array(2048), []);
  const freqBuf = useMemo(() => new Uint8Array(1024), []);

  async function init() {
    try {
      setStatus("OFF");

      const tmp = await navigator.mediaDevices.getUserMedia({ audio: true });
      tmp.getTracks().forEach((t) => t.stop());

      const all = await navigator.mediaDevices.enumerateDevices();
      const inputs = all.filter((d) => d.kind === "audioinput");
      setDevices(inputs);
      setDeviceId(inputs[0]?.deviceId ?? "");
      setStatus("READY");
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(err);
      setStatus("ERROR");
      alert(`Init failed: ${err.message}`);
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    analyserRef.current = null;

    if (ctx) ctx.close().catch(() => {});
    setStatus("STOPPED");
  }

  async function start() {
    try {
      stop();

      if (!deviceId) {
        alert("Pick an input device first.");
        return;
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      const audioCtx = new AudioContextClass({ latencyHint: "interactive" });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.0;
      analyserRef.current = analyser;

      source.connect(analyser);

      setStatus("CAPTURING");

      const draw = () => {
        const ctx = audioCtxRef.current;
        const an = analyserRef.current;
        if (!ctx || !an) return;

        an.getFloatTimeDomainData(timeBuf);
        an.getByteFrequencyData(freqBuf);

        const { rms, db, peak } = rmsDbfs(timeBuf);
        const clipping = peak >= 0.99;

        const pitch = autoCorrelatePitch(timeBuf, ctx.sampleRate);
        setReadout({
          sampleRate: ctx.sampleRate,
          rms,
          db,
          peak,
          clipping,
          pitchHz: pitch?.hz ?? 0,
          pitchConf: pitch?.corr ?? 0,
        });

        const wave = waveCanvasRef.current;
        if (wave) {
          const g = wave.getContext("2d");
          if (g) {
            const w = wave.width;
            const h = wave.height;
            g.clearRect(0, 0, w, h);
            g.fillStyle = "#0b0f19";
            g.fillRect(0, 0, w, h);

            g.strokeStyle = "rgba(255,255,255,0.2)";
            g.beginPath();
            g.moveTo(0, h / 2);
            g.lineTo(w, h / 2);
            g.stroke();

            g.strokeStyle = "#22c55e";
            g.beginPath();
            for (let i = 0; i < timeBuf.length; i++) {
              const x = (i / (timeBuf.length - 1)) * w;
              const y = (0.5 - timeBuf[i] / 2) * h;
              if (i === 0) g.moveTo(x, y);
              else g.lineTo(x, y);
            }
            g.stroke();
          }
        }

        const spec = specCanvasRef.current;
        if (spec) {
          const g = spec.getContext("2d");
          if (g) {
            const w = spec.width;
            const h = spec.height;
            g.clearRect(0, 0, w, h);
            g.fillStyle = "#0b0f19";
            g.fillRect(0, 0, w, h);

            const n = freqBuf.length;
            const barW = w / n;

            g.fillStyle = "#60a5fa";
            for (let i = 0; i < n; i++) {
              const v = freqBuf[i] / 255;
              const barH = v * h;
              g.fillRect(i * barW, h - barH, Math.max(1, barW), barH);
            }
          }
        }

        rafRef.current = requestAnimationFrame(draw);
      };

      rafRef.current = requestAnimationFrame(draw);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error(err);
      setStatus("ERROR");
      alert(
        `Start failed: ${err.message}\n\nTip: use http://localhost:3000 and allow mic permission.`
      );
    }
  }

  useEffect(() => {
    return () => stop();
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Audio Interface Input Test</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Use <span className="font-medium">http://localhost:3000</span>. Click Init → select your
        interface → Start → strum and watch waveform + meters.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={init}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Init / List Inputs
        </button>

        <select
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Audio Input (${d.deviceId.slice(0, 6)}…)`}
            </option>
          ))}
        </select>

        <button
          onClick={start}
          disabled={status !== "READY" && status !== "STOPPED" && status !== "CAPTURING"}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
        >
          Start
        </button>

        <button
          onClick={stop}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          Stop
        </button>

        <span className="ml-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
          {status}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 p-4">
          <div className="text-sm font-semibold">Waveform</div>
          <canvas
            ref={waveCanvasRef}
            width={560}
            height={220}
            className="mt-3 w-full rounded-xl border border-zinc-200"
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 p-4">
          <div className="text-sm font-semibold">Spectrum</div>
          <canvas
            ref={specCanvasRef}
            width={560}
            height={220}
            className="mt-3 w-full rounded-xl border border-zinc-200"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Card label="Sample rate" value={`${readout.sampleRate} Hz`} />
        <Card label="RMS (dBFS-ish)" value={`${readout.db.toFixed(1)} dB`} />
        <Card
          label="Peak / Clip"
          value={`${readout.peak.toFixed(3)}${readout.clipping ? " (CLIP)" : ""}`}
        />
        <Card
          label="Pitch (rough)"
          value={readout.pitchHz > 0 ? `${readout.pitchHz.toFixed(1)} Hz` : "—"}
        />
        <Card
          label="Pitch confidence"
          value={readout.pitchHz > 0 ? readout.pitchConf.toFixed(2) : "—"}
        />
        <div className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-600">
          
        </div>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <div className="text-xs text-zinc-600">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}