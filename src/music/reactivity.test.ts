/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import { authoredReaction, type MusicReaction } from "./reactivity";

const values = (reaction: MusicReaction): readonly number[] => [
  reaction.bass,
  reaction.accent,
  reaction.shimmer,
];

test("returns repeatable finite values between zero and one", () => {
  const times = [
    0,
    0.02,
    1.234,
    75.02,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    -4,
  ];

  for (const time of times) {
    const first = authoredReaction(time, true);
    const second = authoredReaction(time, true);
    assert.deepEqual(first, second);
    for (const value of values(first)) {
      assert.ok(Number.isFinite(value));
      assert.ok(value >= 0 && value <= 1);
    }
  }
});

test("returns silence while playback is paused", () => {
  assert.deepEqual(authoredReaction(75.02, false), {
    bass: 0,
    accent: 0,
    shimmer: 0,
  });
});

test("decays after a provisional kick pulse", () => {
  const attackPeak = authoredReaction(0.018, true);
  const tail = authoredReaction(0.15, true);

  assert.ok(attackPeak.bass > tail.bass);
  assert.ok(attackPeak.shimmer > tail.shimmer);
});

test("scales the same pulse with authored section energy", () => {
  const quietSection = authoredReaction(0.02, true);
  const intenseSection = authoredReaction(75.02, true);

  assert.ok(intenseSection.bass > quietSection.bass);
  assert.ok(intenseSection.shimmer > quietSection.shimmer);
});

test("places the accent on alternating backbeats", () => {
  const firstBeat = authoredReaction(0.389, true);
  const secondBeat = authoredReaction(0.764, true);

  assert.ok(firstBeat.accent > 0.1);
  assert.equal(secondBeat.accent, 0);
});
