import { analyzePcm, type AudioAnalysisFrame } from "./analysis";

interface AnalysisRequest {
  samples: Float32Array;
  sampleRate: number;
  windowSize: number;
}

self.onmessage = (event: MessageEvent<AnalysisRequest>) => {
  const { samples, sampleRate, windowSize } = event.data;
  const frames: AudioAnalysisFrame[] = [];
  for (let offset = 0; offset < samples.length; offset += windowSize) {
    // Reset FFT history per excerpt; discard its artificial initial onset.
    frames.push(
      ...analyzePcm(
        samples.subarray(offset, offset + windowSize),
        sampleRate,
      ).slice(2),
    );
  }
  self.postMessage(frames);
};
