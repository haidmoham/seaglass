import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { analyzeSongFile } from "../audio/analyze-song";
import type { AudioAnalysisFrame } from "../audio/analysis";
import { inferWeather, type WeatherInference } from "../weather/inference";
import type { WeatherMode } from "../weather/modes";
import "./weather-inference.css";

interface WeatherInferencePanelProps {
  onApply: (mode: WeatherMode) => void;
  onClose: () => void;
}

interface SyntheticExample {
  name: string;
  note: string;
  frames: readonly AudioAnalysisFrame[];
}

const syntheticExamples: readonly SyntheticExample[] = [
  {
    name: "Steady dark rain",
    note: "Synthetic · low brightness, steady mid energy",
    frames: [
      { time: 0, rms: 0.035, low: 0.012, mid: 0.03, high: 0.002, onset: 0.002 },
      {
        time: 0.1,
        rms: 0.035,
        low: 0.012,
        mid: 0.03,
        high: 0.002,
        onset: 0.002,
      },
      {
        time: 0.2,
        rms: 0.035,
        low: 0.012,
        mid: 0.03,
        high: 0.002,
        onset: 0.002,
      },
    ],
  },
  {
    name: "Energetic transient storm",
    note: "Synthetic · high energy, bass, and sharp change",
    frames: [
      { time: 0, rms: 0.22, low: 0.2, mid: 0.06, high: 0.03, onset: 0.1 },
      { time: 0.1, rms: 0.22, low: 0.2, mid: 0.06, high: 0.03, onset: 0.1 },
      { time: 0.2, rms: 0.22, low: 0.2, mid: 0.06, high: 0.03, onset: 0.1 },
    ],
  },
  {
    name: "Gentle bright clearing",
    note: "Synthetic · low energy, bright, and steady",
    frames: [
      {
        time: 0,
        rms: 0.025,
        low: 0.002,
        mid: 0.005,
        high: 0.024,
        onset: 0.001,
      },
      {
        time: 0.1,
        rms: 0.025,
        low: 0.002,
        mid: 0.005,
        high: 0.024,
        onset: 0.001,
      },
      {
        time: 0.2,
        rms: 0.025,
        low: 0.002,
        mid: 0.005,
        high: 0.024,
        onset: 0.001,
      },
    ],
  },
] as const;

const scoreOrder: readonly WeatherMode[] = ["rain", "supercell", "clearing"];

function modeLabel(mode: WeatherMode): string {
  if (mode === "supercell") return "Supercell";
  if (mode === "clearing") return "Clearing";
  return "Rain";
}

export function WeatherInferencePanel({
  onApply,
  onClose,
}: WeatherInferencePanelProps) {
  const [selectedLabel, setSelectedLabel] = useState("No file selected");
  const [inference, setInference] = useState<WeatherInference | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    requestId.current += 1;
    const activeRequest = requestId.current;
    const file = event.target.files?.[0];
    setInference(null);
    setError("");

    if (!file) {
      setSelectedLabel("No file selected");
      setBusy(false);
      return;
    }

    setSelectedLabel(file.name);
    setBusy(true);
    try {
      const frames = await analyzeSongFile(file);
      if (requestId.current !== activeRequest) return;
      setInference(inferWeather(frames));
    } catch (caughtError) {
      if (requestId.current !== activeRequest) return;
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The audio could not be analyzed. Try another file.",
      );
    } finally {
      if (requestId.current === activeRequest) setBusy(false);
    }
  }

  function inspectSynthetic(example: SyntheticExample): void {
    requestId.current += 1;
    setBusy(false);
    setError("");
    setSelectedLabel(`${example.name} — synthetic example`);
    setInference(inferWeather(example.frames));
  }

  function applyInference(): void {
    const mode = inference?.mode;
    if (mode) onApply(mode);
  }

  return (
    <div className="weather-inference-backdrop">
      <section
        className="weather-inference-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="weather-inference-title"
      >
        <header className="weather-inference-heading">
          <div>
            <p className="weather-inference-eyebrow">
              LOCAL WEATHER STUDY / 01
            </p>
            <h2 id="weather-inference-title">Let the signal suggest a sky</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close weather inference"
            autoFocus
          >
            ×
          </button>
        </header>

        <p className="weather-inference-intro">
          Choose an audio file from this device. Analysis stays in this browser;
          no file is uploaded. The result is an explainable heuristic, not a
          trained mood detector.
        </p>
        <p className="weather-inference-boundary">
          The YouTube player exposes playback time, not audio samples. Choose a
          local file only if you want measured signal features. Applying the
          result changes this exhibit; the chosen file does not replace YouTube
          playback.
        </p>

        <label className="weather-inference-file">
          <span>{busy ? "Analyzing signal…" : "Choose MP3 or WAV"}</span>
          <input
            type="file"
            accept="audio/*,.mp3,.wav"
            onChange={handleFileChange}
          />
        </label>
        <p className="weather-inference-filename" aria-live="polite">
          {selectedLabel}
        </p>
        {error ? (
          <p className="weather-inference-error" role="alert">
            {error}
          </p>
        ) : null}

        <div
          className="weather-inference-examples"
          aria-labelledby="synthetic-title"
        >
          <div>
            <p className="weather-inference-eyebrow" id="synthetic-title">
              SYNTHETIC SIGNAL EXAMPLES
            </p>
            <p>
              Constructed frames for explaining the rule. These are not songs or
              recordings.
            </p>
          </div>
          {syntheticExamples.map((example) => (
            <button
              type="button"
              key={example.name}
              onClick={() => inspectSynthetic(example)}
            >
              <strong>{example.name}</strong>
              <span>{example.note}</span>
            </button>
          ))}
        </div>

        {inference ? (
          <div className="weather-inference-result" aria-live="polite">
            <p className="weather-inference-eyebrow">SUGGESTED WEATHER</p>
            <div className="weather-inference-verdict">
              <h3>{inference.label}</h3>
              <span
                className={
                  inference.ambiguous || !inference.mode
                    ? "is-ambiguous"
                    : "is-clear"
                }
              >
                {!inference.mode
                  ? "Insufficient signal"
                  : inference.ambiguous
                    ? "Ambiguous fit"
                    : "Clearer fit"}
              </span>
            </div>
            <ul className="weather-inference-reasons">
              {inference.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <div
              className="weather-inference-scores"
              aria-label="Relative weather fit scores"
            >
              {scoreOrder.map((mode) => (
                <div className="weather-inference-score" key={mode}>
                  <span>{modeLabel(mode)}</span>
                  <div aria-hidden="true">
                    <i style={{ width: `${inference.scores[mode] * 100}%` }} />
                  </div>
                  <output>{inference.scores[mode].toFixed(2)}</output>
                </div>
              ))}
              <p>Relative heuristic fit · values are not probabilities</p>
            </div>
            <p className="weather-inference-result-note">
              Apply changes the exhibit weather only. The local file does not
              replace YouTube playback.
            </p>
          </div>
        ) : null}

        <footer className="weather-inference-actions">
          <button
            type="button"
            className="weather-inference-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="weather-inference-apply"
            onClick={applyInference}
            disabled={!inference?.mode || busy}
          >
            Apply weather
          </button>
        </footer>
      </section>
    </div>
  );
}
