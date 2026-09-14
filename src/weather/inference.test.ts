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

test("flags a close ranking and maps quiet usable audio to snow", () => {
  const close = inferWeather(
    repeated(frame(10 ** (-23 / 20), 0.03, 0.02, 0.05, 0.06)),
  );
  assert.equal(close.ambiguous, true);
  const quiet = inferWeather(repeated(frame(0.008, 0.001, 0.001, 0.007, 0)));
  assert.equal(quiet.mode, "snow");
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

test("classifies an energetic bass-heavy transient fixture as storm", () => {
  const result = inferWeather(repeated(frame(0.28, 0.25, 0.08, 0.03, 0.1)));

  assert.equal(result.mode, "storm");
  assert.ok(result.scores.storm > result.scores.snow);
  assert.ok(result.features.bassShare > 0.6);
});

test("classifies a low steady fixture as snow regardless of brightness", () => {
  const result = inferWeather(
    repeated(frame(0.035, 0.015, 0.028, 0.002, 0.005)),
  );

  assert.equal(result.mode, "snow");
  assert.ok(result.scores.snow > result.scores.sun);
  assert.ok(result.features.brightness < 0.1);
});

test("classifies a gentle bright fixture as snow", () => {
  const result = inferWeather(
    repeated(frame(0.045, 0.002, 0.008, 0.042, 0.004)),
  );

  assert.equal(result.mode, "snow");
  assert.ok(result.scores.snow > result.scores.sun);
  assert.ok(result.features.brightness > 0.8);
});

test("classifies active bright rhythmic audio as sun", () => {
  const result = inferWeather(repeated(frame(0.18, 0.008, 0.025, 0.16, 0.09)));

  assert.equal(result.mode, "sun");
  assert.ok(result.scores.sun > result.scores.storm);
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

  assert.equal(result.mode, "snow");
});

test("separates analyzed bass bursts, gentle tone, and bright rhythmic pulses", () => {
  const sampleRate = 48_000;
  const sampleCount = sampleRate * 2;
  const bassBursts = new Float32Array(sampleCount);
  const gentleTone = new Float32Array(sampleCount);
  const brightPulses = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const burstPhase = time % 0.25;
    const burstEnvelope =
      burstPhase < 0.055 ? Math.sin((Math.PI * burstPhase) / 0.055) ** 2 : 0;
    bassBursts[index] =
      0.85 * burstEnvelope * Math.sin(2 * Math.PI * 80 * time);
    gentleTone[index] = 0.055 * Math.sin(2 * Math.PI * 6_000 * time);
    const brightPhase = time % 0.125;
    const brightEnvelope =
      brightPhase < 0.07 ? Math.sin((Math.PI * brightPhase) / 0.07) ** 2 : 0;
    brightPulses[index] =
      0.5 * brightEnvelope * Math.sin(2 * Math.PI * 6_000 * time);
  }

  const storm = inferWeather(analyzePcm(bassBursts, sampleRate));
  const snow = inferWeather(analyzePcm(gentleTone, sampleRate));
  const sun = inferWeather(analyzePcm(brightPulses, sampleRate));

  assert.equal(storm.mode, "storm");
  assert.equal(snow.mode, "snow");
  assert.equal(sun.mode, "sun");
  assert.ok(storm.features.bassShare > snow.features.bassShare);
  assert.ok(sun.features.transients > snow.features.transients);
  assert.ok(sun.features.brightness > storm.features.brightness);
});
