import { inferWeather, type WeatherInference } from "../weather/inference";
import type { WeatherMode } from "../weather/modes";
import { analyzePcm, type AudioAnalysisFrame } from "./analysis";

export interface LiveWeatherUpdate {
  inference: WeatherInference | null;
  mode: WeatherMode | null;
  status: "listening" | "quiet" | "stopped";
}

export interface WeatherStability {
  push(candidate: WeatherMode, time: number): WeatherMode | null;
  hold(): WeatherMode | null;
  reset(): void;
}

export interface LiveWeatherController {
  stop(): void;
  reset(): void;
  setPlaying(value: boolean): void;
}

const REQUIRED_VOTES = 3;
const MODE_CHANGE_INTERVAL = 8;
const SAMPLE_INTERVAL_MS = 200;
const ROLLING_WINDOW_SECONDS = 4;
const QUIET_RMS = 0.005;

export function createWeatherStability(): WeatherStability {
  let current: WeatherMode | null = null;
  let pending: WeatherMode | null = null;
  let votes = 0;
  let changedAt = Number.NEGATIVE_INFINITY;

  return {
    push(candidate, time) {
      if (candidate === current) {
        pending = null;
        votes = 0;
        return current;
      }

      if (candidate === pending) votes += 1;
      else {
        pending = candidate;
        votes = 1;
      }

      const safeTime = Number.isFinite(time) ? Math.max(0, time) : 0;
      const intervalPassed =
        current === null || safeTime - changedAt >= MODE_CHANGE_INTERVAL;
      if (votes >= REQUIRED_VOTES && intervalPassed) {
        current = candidate;
        changedAt = safeTime;
        pending = null;
        votes = 0;
      }
      return current;
    },
    hold() {
      return current;
    },
    reset() {
      current = null;
      pending = null;
      votes = 0;
      changedAt = Number.NEGATIVE_INFINITY;
    },
  };
}

function meanFrame(
  frames: readonly AudioAnalysisFrame[],
  time: number,
): AudioAnalysisFrame {
  let rms = 0;
  let low = 0;
  let mid = 0;
  let high = 0;
  for (const frame of frames) {
    rms += frame.rms;
    low += frame.low;
    mid += frame.mid;
    high += frame.high;
  }
  const count = Math.max(1, frames.length);
  return {
    time,
    rms: rms / count,
    low: low / count,
    mid: mid / count,
    high: high / count,
    onset: 0,
  };
}

const positiveBandChange = (
  current: AudioAnalysisFrame,
  previous: AudioAnalysisFrame | null,
): number => {
  if (!previous) return 0;
  const increase =
    Math.max(0, current.low - previous.low) +
    Math.max(0, current.mid - previous.mid) +
    Math.max(0, current.high - previous.high);
  const scale = Math.max(0.01, current.low + current.mid + current.high);
  return Math.min(1, increase / scale);
};

export async function startLiveWeather(
  onUpdate: (update: LiveWeatherUpdate) => void,
): Promise<LiveWeatherController> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Tab audio sharing is not supported in this browser.");
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });
  const audioTrack = stream.getAudioTracks()[0];
  if (!audioTrack) {
    for (const track of stream.getTracks()) track.stop();
    throw new Error("Share a browser tab with audio enabled.");
  }

  let context: AudioContext;
  try {
    context = new AudioContext();
  } catch (error) {
    for (const track of stream.getTracks()) track.stop();
    throw error;
  }

  let source: MediaStreamAudioSourceNode;
  let analyser: AnalyserNode;
  try {
    const audioStream = new MediaStream([audioTrack]);
    source = context.createMediaStreamSource(audioStream);
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);
    await context.resume();
  } catch (error) {
    for (const track of stream.getTracks()) track.stop();
    void context.close();
    throw error;
  }

  const samples = new Float32Array(analyser.fftSize);
  const rollingFrames: AudioAnalysisFrame[] = [];
  const stability = createWeatherStability();
  let previousFrame: AudioAnalysisFrame | null = null;
  let stopped = false;
  let playing = true;
  let timer = 0;

  const reset = () => {
    rollingFrames.length = 0;
    previousFrame = null;
    stability.reset();
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timer);
    for (const track of stream.getTracks())
      track.removeEventListener("ended", stop);
    source.disconnect();
    analyser.disconnect();
    for (const track of stream.getTracks()) track.stop();
    reset();
    void context.close();
    onUpdate({ inference: null, mode: null, status: "stopped" });
  };

  for (const track of stream.getTracks()) track.addEventListener("ended", stop);
  onUpdate({ inference: null, mode: null, status: "listening" });

  const sample = () => {
    if (stopped || !playing) return;
    try {
      analyser.getFloatTimeDomainData(samples);
      const analyzed = analyzePcm(samples, context.sampleRate);
      const baseFrame = meanFrame(analyzed, context.currentTime);
      const frame: AudioAnalysisFrame = {
        ...baseFrame,
        onset: positiveBandChange(baseFrame, previousFrame),
      };
      previousFrame = frame;

      if (frame.rms < QUIET_RMS) {
        onUpdate({ inference: null, mode: stability.hold(), status: "quiet" });
        return;
      }

      rollingFrames.push(frame);
      const cutoff = frame.time - ROLLING_WINDOW_SECONDS;
      while ((rollingFrames[0]?.time ?? frame.time) < cutoff)
        rollingFrames.shift();

      const inference = inferWeather(rollingFrames);
      const mode =
        inference.mode === null
          ? stability.hold()
          : stability.push(inference.mode, frame.time);
      onUpdate({ inference, mode, status: "listening" });
    } catch {
      stop();
    }
  };

  timer = window.setInterval(sample, SAMPLE_INTERVAL_MS);
  return {
    stop,
    reset,
    setPlaying(value) {
      if (stopped || value === playing) return;
      playing = value;
      reset();
      if (!playing) onUpdate({ inference: null, mode: null, status: "quiet" });
    },
  };
}
