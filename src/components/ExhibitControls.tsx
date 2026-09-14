import { useState } from "react";
import { weatherModes, type WeatherMode } from "../weather/modes";

interface ExhibitControlsProps {
  intensity: number;
  motion: boolean;
  weather: WeatherMode;
  onIntensityChange(value: number): void;
  onMotionChange(value: boolean): void;
  onResetView(): void;
  onWeatherChange(value: WeatherMode): void;
}

export function ExhibitControls(props: ExhibitControlsProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <nav
      className={`scene-controls${expanded ? " show-weather" : ""}`}
      aria-label="Exhibit controls"
    >
      <div className="control-actions">
        <button
          type="button"
          onClick={props.onResetView}
          aria-label="Reset viewpoint"
        >
          <span aria-hidden="true">↺</span>
          <span>Reset view</span>
        </button>
        <button
          type="button"
          aria-pressed={!props.motion}
          onClick={() => props.onMotionChange(!props.motion)}
        >
          <span aria-hidden="true">{props.motion ? "Ⅱ" : "▷"}</span>
          <span>{props.motion ? "Freeze" : "Resume"}</span>
        </button>
      </div>
      <button
        className="weather-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        Weather <span>{expanded ? "−" : "+"}</span>
      </button>
      <div className="control-detail">
        <fieldset className="weather-control">
          <legend className="sr-only">Weather</legend>
          <div className="weather-options">
            {weatherModes.map((mode) => (
              <button
                type="button"
                key={mode.id}
                className={
                  props.weather === mode.id ? "is-selected" : undefined
                }
                aria-pressed={props.weather === mode.id}
                title={mode.description}
                onClick={() => {
                  props.onWeatherChange(mode.id);
                  setExpanded(false);
                }}
              >
                {mode.shortLabel}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="intensity-control">
          <label htmlFor="storm-intensity">Storm intensity</label>
          <input
            id="storm-intensity"
            type="range"
            min="0.25"
            max="1.5"
            step="0.05"
            value={props.intensity}
            onChange={(event) =>
              props.onIntensityChange(Number(event.target.value))
            }
          />
          <output htmlFor="storm-intensity">
            {Math.round(props.intensity * 100)}%
          </output>
        </div>
      </div>
    </nav>
  );
}
