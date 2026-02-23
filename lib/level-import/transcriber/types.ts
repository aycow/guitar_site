import type { ChartEvent, InstrumentPreset } from "@/types/level-import";

export interface TranscriberInput {
  wavAbsolutePath: string;
  preset: InstrumentPreset;
}

export interface TranscriberOutput {
  events: ChartEvent[];
  warnings: string[];
}

export interface AudioTranscriber {
  name: string;
  transcribe(input: TranscriberInput): Promise<TranscriberOutput>;
}
