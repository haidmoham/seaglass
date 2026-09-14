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
    scores: { snow: 0, storm: 0, sun: 0 },
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

  const scores = {
    storm: clampUnit(
      energy * 0.4 + bassShare * 0.2 + darkness * 0.2 + transients * 0.2,
    ),
    snow: clampUnit(gentle * 0.55 + steady * 0.45),
    sun: clampUnit(brightness * 0.45 + energy * 0.25 + transients * 0.3),
  } satisfies Record<WeatherMode, number>;

  let mode: WeatherMode = "snow";
  let topScore = scores.snow;
  let secondScore = Math.max(scores.storm, scores.sun);
  if (scores.storm > topScore) {
    mode = "storm";
    topScore = scores.storm;
    secondScore = Math.max(scores.snow, scores.sun);
  }
  if (scores.sun > topScore) {
    mode = "sun";
    topScore = scores.sun;
    secondScore = Math.max(scores.snow, scores.storm);
  }

  const percentage = (value: number): string => `${Math.round(value * 100)}%`;
  const reasons = [
    `Tone proxies: energy ${percentage(energy)}; bass share ${percentage(bassShare)}.`,
    `Brightness ${percentage(brightness)}; rhythmic activity ${percentage(transients)}.`,
    "These signal features do not measure musical mood or emotional valence.",
  ];

  return {
    mode,
    label: mode === "storm" ? "Storm" : mode === "sun" ? "Sun" : "Snow",
    reasons,
    scores,
    features: { energy, bassShare, brightness, transients },
    ambiguous: topScore - secondScore < AMBIGUITY_MARGIN,
  };
}
