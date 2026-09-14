/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import { analyzePcm } from "./analysis";

const SAMPLE_RATE = 48_000;
const DURATION_SECONDS = 0.25;

const sineWave = (frequency: number): Float32Array => {
  const samples = new Float32Array(SAMPLE_RATE * DURATION_SECONDS);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] =
      0.8 * Math.sin((2 * Math.PI * frequency * index) / SAMPLE_RATE);
  }
  return samples;
};

const averageAfterAttack = (
  frames: ReturnType<typeof analyzePcm>,
  field: "low" | "mid" | "high",
): number => {
  const settledFrames = frames.slice(2);
  const total = settledFrames.reduce((sum, frame) => sum + frame[field], 0);
  return total / settledFrames.length;
};

test("classifies a low sine wave into the low band", () => {
  const frames = analyzePcm(sineWave(100), SAMPLE_RATE);

  assert.ok(averageAfterAttack(frames, "low") > 0.45);
  assert.ok(
    averageAfterAttack(frames, "low") > averageAfterAttack(frames, "high") * 20,
  );
  const firstOnset = frames[0]?.onset ?? 0;
  const finalOnset = frames.at(-1)?.onset ?? 0;
  assert.ok(firstOnset > finalOnset);
});

test("classifies a high sine wave into the high band", () => {
  const frames = analyzePcm(sineWave(6_000), SAMPLE_RATE);

  assert.ok(averageAfterAttack(frames, "high") > 0.45);
  assert.ok(
    averageAfterAttack(frames, "high") > averageAfterAttack(frames, "low") * 20,
  );
});

test("keeps silence finite and at zero", () => {
  const frames = analyzePcm(new Float32Array(SAMPLE_RATE / 10), SAMPLE_RATE);

  assert.ok(frames.length > 0);
  for (const frame of frames) {
    assert.deepEqual(frame, {
      time: frame.time,
      rms: 0,
      low: 0,
      mid: 0,
      high: 0,
      onset: 0,
    });
    assert.ok(Number.isFinite(frame.time));
  }
});

test("detects a transition out of silence and smooths the band response", () => {
  const silenceLength = Math.round(SAMPLE_RATE * 0.1);
  const signal = sineWave(100);
  const samples = new Float32Array(silenceLength + signal.length);
  samples.set(signal, silenceLength);

  const frames = analyzePcm(samples, SAMPLE_RATE);
  const beforeTransition = frames.findLast((frame) => frame.time < 0.06);
  const transitionFrames = frames.filter(
    (frame) => frame.time >= 0.06 && frame.time <= 0.14,
  );
  const onsetPeak = Math.max(...transitionFrames.map((frame) => frame.onset));
  const finalFrame = frames.at(-1);

  assert.equal(beforeTransition?.low, 0);
  assert.ok(onsetPeak > 0.2);
  assert.ok(onsetPeak > (finalFrame?.onset ?? 0) * 5);
  assert.ok((finalFrame?.low ?? 0) > 0.45);
  assert.ok(
    transitionFrames.some(
      (frame) => frame.low > 0 && frame.low < (finalFrame?.low ?? 0),
    ),
  );
});

test("returns no frames for invalid input", () => {
  assert.deepEqual(analyzePcm(new Float32Array(), SAMPLE_RATE), []);
  assert.deepEqual(analyzePcm(new Float32Array([1]), 0), []);
});
