export type AudioAnalysisFrame = Readonly<{
  time: number;
  rms: number;
  low: number;
  mid: number;
  high: number;
  onset: number;
}>;

const WINDOW_SIZE = 2048;
const HOP_SIZE = 512;
const SILENCE_FLOOR = 1e-10;

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

const smooth = (current: number, previous: number): number => {
  const coefficient = current > previous ? 0.65 : 0.25;
  return previous + coefficient * (current - previous);
};

const reverseBits = (value: number, bitCount: number): number => {
  let source = value;
  let reversed = 0;
  for (let bit = 0; bit < bitCount; bit += 1) {
    reversed = (reversed << 1) | (source & 1);
    source >>>= 1;
  }
  return reversed;
};

const fft = (real: Float64Array, imaginary: Float64Array): void => {
  const size = real.length;
  const bitCount = Math.log2(size);

  for (let index = 0; index < size; index += 1) {
    const target = reverseBits(index, bitCount);
    if (target <= index) continue;

    const realValue = real[index];
    real[index] = real[target];
    real[target] = realValue;

    const imaginaryValue = imaginary[index];
    imaginary[index] = imaginary[target];
    imaginary[target] = imaginaryValue;
  }

  for (let span = 2; span <= size; span *= 2) {
    const halfSpan = span / 2;
    const angleStep = (-2 * Math.PI) / span;
    for (let start = 0; start < size; start += span) {
      for (let offset = 0; offset < halfSpan; offset += 1) {
        const angle = angleStep * offset;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const evenIndex = start + offset;
        const oddIndex = evenIndex + halfSpan;
        const oddReal = real[oddIndex] * cosine - imaginary[oddIndex] * sine;
        const oddImaginary =
          real[oddIndex] * sine + imaginary[oddIndex] * cosine;

        real[oddIndex] = real[evenIndex] - oddReal;
        imaginary[oddIndex] = imaginary[evenIndex] - oddImaginary;
        real[evenIndex] += oddReal;
        imaginary[evenIndex] += oddImaginary;
      }
    }
  }
};

const hann = (index: number): number =>
  0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (WINDOW_SIZE - 1));

export const analyzePcm = (
  samples: Float32Array,
  sampleRate: number,
): readonly AudioAnalysisFrame[] => {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || samples.length === 0)
    return [];

  const frameCount = Math.max(
    1,
    Math.ceil((samples.length - WINDOW_SIZE) / HOP_SIZE) + 1,
  );
  const frames: AudioAnalysisFrame[] = [];
  const previousMagnitudes = new Float64Array(WINDOW_SIZE / 2 + 1);
  let previousLow = 0;
  let previousMid = 0;
  let previousHigh = 0;
  let windowEnergy = 0;

  for (let index = 0; index < WINDOW_SIZE; index += 1) {
    const weight = hann(index);
    windowEnergy += weight * weight;
  }

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const offset = frameIndex * HOP_SIZE;
    const real = new Float64Array(WINDOW_SIZE);
    const imaginary = new Float64Array(WINDOW_SIZE);
    let squareSum = 0;

    for (let index = 0; index < WINDOW_SIZE; index += 1) {
      const sample = samples[offset + index] ?? 0;
      squareSum += sample * sample;
      real[index] = sample * hann(index);
    }

    fft(real, imaginary);

    let lowPower = 0;
    let midPower = 0;
    let highPower = 0;
    let positiveFlux = 0;
    let magnitudeSum = 0;

    for (let bin = 0; bin <= WINDOW_SIZE / 2; bin += 1) {
      const magnitudeSquared =
        real[bin] * real[bin] + imaginary[bin] * imaginary[bin];
      const oneSidedWeight = bin === 0 || bin === WINDOW_SIZE / 2 ? 1 : 2;
      const weightedPower = magnitudeSquared * oneSidedWeight;
      const magnitude = Math.sqrt(weightedPower);
      const frequency = (bin * sampleRate) / WINDOW_SIZE;

      if (frequency >= 20 && frequency < 250) lowPower += weightedPower;
      else if (frequency >= 250 && frequency < 2000) midPower += weightedPower;
      else if (frequency >= 2000) highPower += weightedPower;

      positiveFlux += Math.max(0, magnitude - previousMagnitudes[bin]);
      magnitudeSum += magnitude;
      previousMagnitudes[bin] = magnitude;
    }

    const powerScale = WINDOW_SIZE * windowEnergy;
    const rawLow = clampUnit(Math.sqrt(lowPower / powerScale));
    const rawMid = clampUnit(Math.sqrt(midPower / powerScale));
    const rawHigh = clampUnit(Math.sqrt(highPower / powerScale));
    const low = smooth(rawLow, previousLow);
    const mid = smooth(rawMid, previousMid);
    const high = smooth(rawHigh, previousHigh);
    const rms = clampUnit(Math.sqrt(squareSum / WINDOW_SIZE));
    const onset =
      magnitudeSum <= SILENCE_FLOOR
        ? 0
        : clampUnit(positiveFlux / magnitudeSum);

    frames.push({
      time: offset / sampleRate,
      rms,
      low,
      mid,
      high,
      onset,
    });

    previousLow = low;
    previousMid = mid;
    previousHigh = high;
  }

  return frames;
};
