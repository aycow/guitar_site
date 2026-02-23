import { spawn } from "node:child_process";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import type { StemSeparator, StemSeparationInput, StemSeparationOutput } from "@/lib/level-import/stems/types";

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `${command} exited with code ${code}`));
      }
    });
  });
}

function toPublicUrl(absolutePath: string) {
  const publicRoot = path.join(process.cwd(), "public");
  const relative = path.relative(publicRoot, absolutePath).replace(/\\/g, "/");
  return `/${relative}`;
}

class DemucsStemSeparator implements StemSeparator {
  name = "demucs";

  async separate(input: StemSeparationInput): Promise<StemSeparationOutput> {
    const outputRoot = path.join(path.dirname(input.sourceAudioAbsolutePath), "stems");
    await mkdir(outputRoot, { recursive: true });

    try {
      await runCommand("demucs", [
        "--mp3",
        "--out",
        outputRoot,
        input.sourceAudioAbsolutePath,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown demucs error";
      return {
        stemAbsolutePath: input.sourceAudioAbsolutePath,
        stemPublicUrl: toPublicUrl(input.sourceAudioAbsolutePath),
        warnings: [
          `Demucs separation unavailable (${message}). Continuing with original audio.`,
        ],
      };
    }

    // Demucs output layout varies by model, so we fallback to source unless a dedicated resolver is added.
    return {
      stemAbsolutePath: input.sourceAudioAbsolutePath,
      stemPublicUrl: toPublicUrl(input.sourceAudioAbsolutePath),
      warnings: [
        "Demucs command ran, but stem resolver is in V2 placeholder mode. Source audio is used for now.",
      ],
    };
  }
}

let singleton: StemSeparator | null = null;

export function getStemSeparator() {
  if (singleton) {
    return singleton;
  }
  singleton = new DemucsStemSeparator();
  return singleton;
}
