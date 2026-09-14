export type WeatherMode = "snow" | "storm" | "sun";

export interface WeatherModeMetadata {
  id: WeatherMode;
  label: string;
  shortLabel: string;
  tone: string;
  description: string;
}

export const weatherModes: readonly WeatherModeMetadata[] = [
  {
    id: "snow",
    label: "Snow",
    shortLabel: "Snow",
    tone: "Chill · introspective",
    description:
      "Chill and introspective: slow snowfall, pale light, and quiet water.",
  },
  {
    id: "storm",
    label: "Storm",
    shortLabel: "Storm",
    tone: "Intense · sad",
    description:
      "Intense and sad: dark clouds, driving rain, and charged sea glass.",
  },
  {
    id: "sun",
    label: "Sun",
    shortLabel: "Sun",
    tone: "Happy · upbeat",
    description:
      "Happy and upbeat: open sky, warm sunlight, and sparkling water.",
  },
] as const;

export interface WeatherProfile {
  rainDensity: number;
  rainAngle: number;
  rainSpeed: number;
  cloudCoverage: number;
  cloudRotation: number;
  cloudHeight: number;
  turbulence: number;
  debrisWind: number;
  lightningActivity: number;
  waveAmplitude: number;
  waveSpeed: number;
  foam: number;
  fogDensity: number;
  exposure: number;
  sky: number;
  fog: number;
  keyLight: number;
  fillLight: number;
  oceanDeep: number;
  oceanBright: number;
}

export const weatherProfiles = {
  snow: {
    rainDensity: 0,
    rainAngle: 0.45,
    rainSpeed: 16,
    cloudCoverage: 0.35,
    cloudRotation: 0.035,
    cloudHeight: 22,
    turbulence: 0.08,
    debrisWind: 0,
    lightningActivity: 0,
    waveAmplitude: 0.2,
    waveSpeed: 0.72,
    foam: 0.42,
    fogDensity: 0.012,
    exposure: 1.06,
    sky: 0x233443,
    fog: 0x798d9d,
    keyLight: 0xc4dce9,
    fillLight: 0x7e89b1,
    oceanDeep: 0x031c2b,
    oceanBright: 0x087575,
  },
  storm: {
    rainDensity: 1,
    rainAngle: 0.72,
    rainSpeed: 27,
    cloudCoverage: 1,
    cloudRotation: 0.62,
    cloudHeight: 0,
    turbulence: 1,
    debrisWind: 1,
    lightningActivity: 1,
    waveAmplitude: 1,
    waveSpeed: 1.18,
    foam: 1,
    fogDensity: 0.015,
    exposure: 1.2,
    sky: 0x010711,
    fog: 0x061522,
    keyLight: 0x8dfbe1,
    fillLight: 0x963049,
    oceanDeep: 0x010c18,
    oceanBright: 0x087575,
  },
  sun: {
    rainDensity: 0,
    rainAngle: 0.16,
    rainSpeed: 7,
    cloudCoverage: 0.12,
    cloudRotation: 0.08,
    cloudHeight: 26,
    turbulence: 0.12,
    debrisWind: 0,
    lightningActivity: 0,
    waveAmplitude: 0.28,
    waveSpeed: 0.38,
    foam: 0.3,
    fogDensity: 0.0045,
    exposure: 1.42,
    sky: 0x5f9fa8,
    fog: 0x8dc6c0,
    keyLight: 0xfff4dc,
    fillLight: 0x54c6b1,
    oceanDeep: 0x063747,
    oceanBright: 0x34a89b,
  },
} satisfies Readonly<Record<WeatherMode, WeatherProfile>>;
