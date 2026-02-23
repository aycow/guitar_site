import type { AudioTranscriber, TranscriberInput, TranscriberOutput } from "@/lib/level-import/transcriber/types";

class PlaceholderTranscriber implements AudioTranscriber {
  name = "placeholder-transcriber";

  async transcribe(input: TranscriberInput): Promise<TranscriberOutput> {
    void input;
    return {
      events: [],
      warnings: [
        "Audio transcription is running in placeholder mode. Plug in Basic Pitch to generate notes.",
      ],
    };
  }
}

let singleton: AudioTranscriber | null = null;

export function getTranscriber(): AudioTranscriber {
  if (singleton) {
    return singleton;
  }
  singleton = new PlaceholderTranscriber();
  return singleton;
}
