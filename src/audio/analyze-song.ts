import type { AudioAnalysisFrame } from "./analysis";

const SAMPLE_RATE = 16000;
const EXCERPT_SECONDS = 2;
const EXCERPTS = 12;

// Sample across the whole recording rather than classifying only its intro.
export async function analyzeSongFile(
  file: File,
): Promise<readonly AudioAnalysisFrame[]> {
  if (file.size > 30 * 1024 * 1024)
    throw new Error("Choose an audio file smaller than 30 MB.");
  const context = new OfflineAudioContext(1, 1, SAMPLE_RATE);
  let decoded: AudioBuffer;
  try {
    decoded = await context.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error("This audio file could not be decoded. Try MP3 or WAV.");
  }
  if (decoded.duration < 2 || decoded.duration > 600) {
    throw new Error(
      "Choose a recording between 2 seconds and 10 minutes long.",
    );
  }
  const windowSize = Math.round(EXCERPT_SECONDS * decoded.sampleRate);
  const count = Math.min(
    EXCERPTS,
    Math.floor(decoded.duration / EXCERPT_SECONDS),
  );
  const samples = new Float32Array(count * windowSize);
  for (let excerpt = 0; excerpt < count; excerpt += 1) {
    const start =
      count === 1
        ? 0
        : Math.floor(((decoded.length - windowSize) * excerpt) / (count - 1));
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const data = decoded.getChannelData(channel);
      for (let i = 0; i < windowSize; i += 1) {
        samples[excerpt * windowSize + i] +=
          data[start + i] / decoded.numberOfChannels;
      }
    }
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./song-analysis.worker.ts", import.meta.url),
      { type: "module" },
    );
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Analysis timed out. Try a shorter recording."));
    }, 20000);
    worker.onmessage = (event: MessageEvent<readonly AudioAnalysisFrame[]>) => {
      window.clearTimeout(timeout);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new Error("Audio analysis failed. Please try another file."));
    };
    worker.postMessage(
      { samples, sampleRate: decoded.sampleRate, windowSize },
      [samples.buffer],
    );
  });
}
