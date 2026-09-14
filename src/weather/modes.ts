export type WeatherMode = "rain" | "supercell" | "clearing";

export interface WeatherModeMetadata {
  id: WeatherMode;
  label: string;
  shortLabel: string;
  description: string;
}

export const weatherModes: readonly WeatherModeMetadata[] = [
  {
    id: "rain",
    label: "Sea Rain",
    shortLabel: "Rain",
    description: "Cold diagonal rain moves across a low teal shelf cloud.",
  },
  {
    id: "supercell",
    label: "Supercell",
    shortLabel: "Storm",
    description:
      "The full mesocyclone turns above charged sea glass and branching lightning.",
  },
  {
    id: "clearing",
    label: "After the Storm",
    shortLabel: "Clearing",
    description:
      "The canopy opens into porcelain light, sea green water, and a final glass glow.",
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
  rain: {
    rainDensity: 0.78,
    rainAngle: 0.45,
    rainSpeed: 16,
    cloudCoverage: 0.78,
    cloudRotation: 0.24,
    cloudHeight: 4,
    turbulence: 0.38,
    debrisWind: 0.35,
    lightningActivity: 0.18,
    waveAmplitude: 0.58,
    waveSpeed: 0.72,
    foam: 0.42,
    fogDensity: 0.012,
    exposure: 1.06,
    sky: 0x031c28,
    fog: 0x052431,
    keyLight: 0x63d9d2,
    fillLight: 0x553094,
    oceanDeep: 0x031c2b,
    oceanBright: 0x087575,
  },
  supercell: {
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
  clearing: {
    rainDensity: 0.08,
    rainAngle: 0.16,
    rainSpeed: 7,
    cloudCoverage: 0.46,
    cloudRotation: 0.08,
    cloudHeight: 10,
    turbulence: 0.12,
    debrisWind: 0.08,
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
