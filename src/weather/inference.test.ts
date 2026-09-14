/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import { analyzePcm, type AudioAnalysisFrame } from "../audio/analysis";
import { inferWeather } from "./inference";

function frame(
  rms: number,
  low: number,
  mid: number,
  high: number,
  onset: number,
  time = 0,
): AudioAnalysisFrame {
  return { time, rms, low, mid, high, onset };
}

function repeated(value: AudioAnalysisFrame): readonly AudioAnalysisFrame[] {
  return Array.from({ length: 16 }, (_, index) => ({
    ...value,
    time: index * 0.01,
  }));
}

test("flags a close ranking and preserves quiet usable audio", () => {
  const close = inferWeather(
    repeated(frame(10 ** (-23 / 20), 0.02, 0.024, 0.036, 0)),
  );
  assert.equal(close.ambiguous, true);
  const quiet = inferWeather(repeated(frame(0.008, 0.001, 0.001, 0.007, 0)));
  assert.equal(quiet.mode, "clearing");
});

test("rejects empty, silent, and invalid analysis", () => {
  assert.equal(inferWeather([]).mode, null);
  assert.equal(inferWeather(repeated(frame(0, 0, 0, 0, 0))).mode, null);
  assert.equal(
    inferWeather([frame(Number.NaN, 0.2, 0.2, 0.2, 0.2)]).mode,
    null,
  );
  assert.equal(inferWeather([frame(0.4, 1.1, 0.2, 0.2, 0.2)]).mode, null);
});

test("classifies an energetic bass-heavy transient fixture as supercell", () => {
  const result = inferWeather(repeated(frame(0.28, 0.25, 0.08, 0.03, 0.1)));

  assert.equal(result.mode, "supercell");
  assert.ok(result.scores.supercell > result.scores.rain);
  assert.ok(result.features.bassShare > 0.6);
});

test("classifies a low dark steady fixture as rain", () => {
  const result = inferWeather(
    repeated(frame(0.035, 0.015, 0.028, 0.002, 0.005)),
  );

  assert.equal(result.mode, "rain");
  assert.ok(result.scores.rain > result.scores.clearing);
  assert.ok(result.features.brightness < 0.1);
});

test("classifies a gentle bright fixture as clearing", () => {
  const result = inferWeather(
    repeated(frame(0.045, 0.002, 0.008, 0.042, 0.004)),
  );

  assert.equal(result.mode, "clearing");
  assert.ok(result.scores.clearing > result.scores.rain);
  assert.ok(result.features.brightness > 0.8);
});

test("is deterministic and keeps boundary scores finite and bounded", () => {
  const fixtures = [frame(1, 1, 1, 1, 1), frame(0.01, 0, 1, 0, 0)];
  const first = inferWeather(fixtures);
  const second = inferWeather(fixtures);

  assert.deepEqual(first, second);
  for (const score of Object.values(first.scores)) {
    assert.ok(Number.isFinite(score));
    assert.ok(score >= 0 && score <= 1);
  }
  for (const feature of Object.values(first.features)) {
    assert.ok(Number.isFinite(feature));
    assert.ok(feature >= 0 && feature <= 1);
  }
  assert.ok(first.ambiguous === true || first.ambiguous === false);
});

test("ignores invalid frames when usable signal remains", () => {
  const valid = repeated(frame(0.045, 0.002, 0.008, 0.042, 0.004));
  const result = inferWeather([...valid, frame(Number.NaN, 0, 0, 0, 0)]);

  assert.equal(result.mode, "clearing");
});

test("separates analyzed transient bass from a gentle bright tone", () => {
  const sampleRate = 48_000;
  const sampleCount = sampleRate * 2;
  const bassBursts = new Float32Array(sampleCount);
  const gentleTone = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const burstPhase = time % 0.25;
    const burstEnvelope =
      burstPhase < 0.055 ? Math.sin((Math.PI * burstPhase) / 0.055) ** 2 : 0;
    bassBursts[index] =
      0.85 * burstEnvelope * Math.sin(2 * Math.PI * 80 * time);
    gentleTone[index] = 0.055 * Math.sin(2 * Math.PI * 6_000 * time);
  }

  const storm = inferWeather(analyzePcm(bassBursts, sampleRate));
  const clearing = inferWeather(analyzePcm(gentleTone, sampleRate));

  assert.equal(storm.mode, "supercell");
  assert.equal(clearing.mode, "clearing");
  assert.ok(storm.features.transients > clearing.features.transients);
  assert.ok(storm.features.bassShare > clearing.features.bassShare);
});
