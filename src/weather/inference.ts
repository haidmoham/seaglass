import type { AudioAnalysisFrame } from "../audio/analysis";
import type { WeatherMode } from "./modes";

export interface WeatherInference {
  mode: WeatherMode | null;
  label: string;
  reasons: readonly string[];
  scores: Record<WeatherMode, number>;
  features: {
    energy: number;
    bassShare: number;
    brightness: number;
    transients: number;
  };
  ambiguous: boolean;
}

const SILENCE_THRESHOLD = 0.005;
const AMBIGUITY_MARGIN = 0.08;

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

function normalizedEnergy(rms: number): number {
  const decibels = 20 * Math.log10(Math.max(rms, 1e-6));
  return clampUnit((decibels + 36) / 26);
}

function validUnit(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function usableFrame(frame: AudioAnalysisFrame): boolean {
  return (
    Number.isFinite(frame.time) &&
    frame.time >= 0 &&
    validUnit(frame.rms) &&
    validUnit(frame.low) &&
    validUnit(frame.mid) &&
    validUnit(frame.high) &&
    validUnit(frame.onset)
  );
}

function emptyInference(reason: string): WeatherInference {
  return {
    mode: null,
    label: "No usable signal",
    reasons: [reason],
    scores: { rain: 0, supercell: 0, clearing: 0 },
    features: { energy: 0, bassShare: 0, brightness: 0, transients: 0 },
    ambiguous: false,
  };
}

export function inferWeather(
  frames: readonly AudioAnalysisFrame[],
): WeatherInference {
  const usableFrames = frames.filter(usableFrame);
  if (usableFrames.length === 0)
    return emptyInference("No valid analysis frames were available.");

  let rmsTotal = 0;
  let lowTotal = 0;
  let midTotal = 0;
  let highTotal = 0;
  let onsetTotal = 0;

  for (const frame of usableFrames) {
    rmsTotal += frame.rms;
    lowTotal += frame.low;
    midTotal += frame.mid;
    highTotal += frame.high;
    onsetTotal += frame.onset;
  }

  const count = usableFrames.length;
  const meanRms = rmsTotal / count;
  const energy = normalizedEnergy(meanRms);
  const spectralTotal = lowTotal + midTotal + highTotal;
  if (
    meanRms < SILENCE_THRESHOLD ||
    spectralTotal / count < SILENCE_THRESHOLD
  ) {
    return emptyInference(
      "The supplied audio analysis contains silence or too little signal.",
    );
  }

  const bassShare = clampUnit(lowTotal / spectralTotal);
  const brightness = clampUnit(highTotal / spectralTotal);
  const transients = clampUnit(onsetTotal / count / 0.12);
  const steady = 1 - transients;
  const gentle = 1 - energy;
  const darkness = 1 - brightness;
  const midShare = clampUnit(midTotal / spectralTotal);

  const scores = {
    supercell: clampUnit(energy * 0.5 + bassShare * 0.25 + transients * 0.25),
    rain: clampUnit(
      darkness * 0.45 + gentle * 0.25 + steady * 0.2 + midShare * 0.1,
    ),
    clearing: clampUnit(brightness * 0.5 + gentle * 0.3 + steady * 0.2),
  } satisfies Record<WeatherMode, number>;

  let mode: WeatherMode = "rain";
  let topScore = scores.rain;
  let secondScore = Math.max(scores.supercell, scores.clearing);
  if (scores.supercell > topScore) {
    mode = "supercell";
    topScore = scores.supercell;
    secondScore = Math.max(scores.rain, scores.clearing);
  }
  if (scores.clearing > topScore) {
    mode = "clearing";
    topScore = scores.clearing;
    secondScore = Math.max(scores.rain, scores.supercell);
  }

  const percentage = (value: number): string => `${Math.round(value * 100)}%`;
  const reasons = [
    `Calibrated energy ${percentage(energy)}; bass share ${percentage(bassShare)}.`,
    `Brightness ${percentage(brightness)}; transient activity ${percentage(transients)}.`,
  ];

  return {
    mode,
    label:
      mode === "supercell"
        ? "Supercell"
        : mode === "clearing"
          ? "Clearing"
          : "Rain",
    reasons,
    scores,
    features: { energy, bassShare, brightness, transients },
    ambiguous: topScore - secondScore < AMBIGUITY_MARGIN,
  };
}
