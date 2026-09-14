/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";

import { createWeatherStability } from "./live-weather";

test("requires three consecutive votes before selecting a mode", () => {
  const stability = createWeatherStability();

  assert.equal(stability.push("snow", 0), null);
  assert.equal(stability.push("snow", 0.2), null);
  assert.equal(stability.push("snow", 0.4), "snow");
});

test("does not flicker when candidate votes alternate", () => {
  const stability = createWeatherStability();
  stability.push("snow", 0);
  stability.push("snow", 0.2);
  stability.push("snow", 0.4);

  assert.equal(stability.push("sun", 9), "snow");
  assert.equal(stability.push("storm", 9.2), "snow");
  assert.equal(stability.push("sun", 9.4), "snow");
  assert.equal(stability.hold(), "snow");
});

test("enforces the minimum interval between mode changes", () => {
  const stability = createWeatherStability();
  stability.push("snow", 0);
  stability.push("snow", 0.2);
  stability.push("snow", 0.4);

  stability.push("storm", 2);
  stability.push("storm", 2.2);
  assert.equal(stability.push("storm", 2.4), "snow");
  assert.equal(stability.push("storm", 8.5), "storm");
});

test("holding during silence preserves the stable mode and pending votes", () => {
  const stability = createWeatherStability();
  stability.push("sun", 0);
  stability.push("sun", 0.2);
  stability.push("sun", 0.4);
  stability.push("storm", 9);

  assert.equal(stability.hold(), "sun");
  assert.equal(stability.hold(), "sun");
  assert.equal(stability.push("storm", 9.4), "sun");
  assert.equal(stability.push("storm", 9.6), "storm");
});

test("reset clears stable and pending state", () => {
  const stability = createWeatherStability();
  stability.push("sun", 0);
  stability.push("sun", 0.2);
  stability.push("sun", 0.4);
  stability.push("storm", 9);
  stability.reset();

  assert.equal(stability.hold(), null);
  assert.equal(stability.push("storm", 10), null);
});
