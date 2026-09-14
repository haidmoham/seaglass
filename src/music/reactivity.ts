import { cueEnergy } from "./cues";

export interface MusicReaction {
  bass: number;
  accent: number;
  shimmer: number;
}

// Provisional art direction only. This 160 BPM grid is not detected song data.
const BEAT_SECONDS = 60 / 160;
const EIGHTH_SECONDS = BEAT_SECONDS / 2;

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

function pulse(
  time: number,
  period: number,
  attack: number,
  decay: number,
): number {
  const phase = time % period;
  if (phase < attack) return phase / attack;
  return Math.exp(-(phase - attack) / decay);
}

export function authoredReaction(
  time: number,
  playing: boolean,
): MusicReaction {
  if (!playing) return { bass: 0, accent: 0, shimmer: 0 };

  const safeTime = Number.isFinite(time) ? Math.max(0, time) : 0;
  const sectionEnergy = clampUnit(cueEnergy(safeTime));
  const bassPulse = pulse(safeTime, BEAT_SECONDS, 0.018, 0.105);
  const eighthPulse = pulse(safeTime, EIGHTH_SECONDS, 0.012, 0.055);
  const twoBeatPhase = safeTime % (BEAT_SECONDS * 2);
  const backbeatPulse =
    twoBeatPhase < BEAT_SECONDS
      ? 0
      : pulse(twoBeatPhase - BEAT_SECONDS, BEAT_SECONDS, 0.014, 0.085);

  return {
    bass: clampUnit(bassPulse * (0.3 + sectionEnergy * 0.7)),
    accent: clampUnit(backbeatPulse * (0.2 + sectionEnergy * 0.8)),
    shimmer: clampUnit(eighthPulse * (0.08 + sectionEnergy * 0.22)),
  };
}
