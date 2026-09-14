# Sea Glass: Reproducible Spectral Crescendo System

## Decision

Build one renderer around two interchangeable signal providers:

1. **Authored provider now.** The YouTube player supplies playback time and state. A small cue file supplies the musical and lyrical intent. Every output must be labeled `source: "authored"`.
2. **Measured provider later.** A lawfully obtained, independently supplied recording is analyzed offline. The analyzer writes the same normalized control channels. Every output must be labeled `source: "measured"` and carry the audio hash and analyzer configuration.

This split is not a temporary hack. It is the clean boundary between playback, analysis, and rendering. It also prevents the renderer from claiming evidence that does not exist.

The musical crescendo should not be a single “intensity” slider. It should be a coordinated state change: the supercell reaches maximum pressure, the cloud shell opens, shard motion becomes coherent, and the ocean changes from dark absorption to sky-blue, porcelain, and sea-glass-green reflection. Low-level audio features can support that motion later, but the semantic opening must remain an authored cue because spectral features cannot determine lyrical meaning.

## Evidence boundary

### Verified facts

- The artist’s Bandcamp page identifies **“Sea Glass”** as track 6 of _Tempest_, gives a duration of **3:42**, and dates the release to **November 22, 2024**. The published lyrics include the sea-glass, ocean-reflection, sky-blue, porcelain, green-light, and tempest imagery that motivates the visual change.[1](#source-1)
- YouTube’s oEmbed response for video `s77kCPJC42Y` identifies the title as **“Sea Glass”** and the author as **“Driveways - Topic.”**[2](#source-2)
- The documented IFrame Player API provides player state, elapsed time through `getCurrentTime()`, and duration through `getDuration()`.[3](#source-3)
- The documented IFrame interface does not expose decoded PCM samples. This is an inference from the published interface, not a statement about undocumented browser internals. YouTube’s current developer policies also prohibit separating, isolating, or modifying the audio or video components and prohibit using other technology to retrieve YouTube audiovisual content.[4](#source-4)

### Not measured

No audio was downloaded, captured, decoded, or analyzed for this report. No track timestamps, tempo, beat grid, onset locations, spectral values, or section boundaries are claimed. The visual palette below is an authored interpretation of the supplied description. It is not a color sample from the unavailable lyric image.

## System boundary

The renderer should consume one stable interface and remain unaware of how the values were produced.

```ts
type EvidenceSource = "authored" | "measured";

type ControlFrameV1 = {
  version: 1;
  t: number; // media time, seconds
  source: EvidenceSource;
  confidence: number; // overall provider confidence, 0..1

  pressure: number; // slow perceived energy, 0..1
  impact: number; // transient/percussive drive, 0..1
  bassMass: number; // low-frequency share, 0..1
  brightness: number; // spectral center of mass, 0..1
  noisiness: number; // noise-like versus tone-like, 0..1
  coherence: number; // harmonic versus percussive continuity, 0..1
  noveltyShort: number; // local change, 0..1
  noveltyLong: number; // section-scale change, 0..1
  pulse: number; // continuous local pulse, 0..1
  pulseConfidence: number; // gate for pulse use, 0..1

  crest: number; // semantic authored opening, 0..1
  weatherIntent?: "rain" | "supercell" | "clearing";
};

interface SignalProvider {
  sample(mediaTimeS: number): ControlFrameV1;
  seek(mediaTimeS: number): void;
  reset(): void;
}
```

`crest` is deliberately separate from the measured features. In authored mode it is a cue curve. In measured mode it remains an annotation layered over analysis. A later classifier may suggest a crest location, but it must not silently replace the annotation.

## Feature set

The recommended analyzer uses a small set of features with separate visual jobs. It does not expose every common audio descriptor.

### Shared time-frequency representation

For mono signal `x[n]`, sample rate `Fs`, Hann window `w[n]`, transform size `N`, and hop `H`:

\[
X(k,m)=\sum_{n=0}^{N-1}x[n+mH]w[n]e^{-j2\pi kn/N},\qquad P(k,m)=|X(k,m)|^2
\]

The short-time Fourier transform (STFT) is the standard overlapping-window representation used here. Window length trades time resolution against frequency resolution.[5](#source-5) Use `Fs = 44,100 Hz`, `N = 2048`, `H = 512`, Hann window, and `center = false`. This gives a 46.4 ms window and an 11.6 ms hop. The left-aligned choice removes hidden half-window padding from synchronization. If a centered implementation is used, record and compensate its `N/(2Fs) = 23.2 ms` offset.

Compute a 64-band mel power spectrogram from 30 Hz to 16 kHz for flux, PCEN, and novelty. Keep the linear-frequency power spectrogram for band ratios, centroid, rolloff, and flatness.

### 1. Multiscale perceived energy → pressure and impact body

Apply the ITU-R BS.1770 K-weighting filters before energy aggregation. BS.1770 is the current official loudness and true-peak measurement recommendation.[6](#source-6) Compute three causal energy envelopes:

- `E100`: 100 ms RMS for impact body.
- `E400`: 400 ms momentary loudness scale.
- `E3000`: 3 s short-term loudness scale.

The 400 ms and 3 s windows follow EBU Mode time scales.[7](#source-7) They are used as useful perceptual time constants, not as a claim of full broadcast-compliant loudness metering. Map `E3000` to `pressure`. Blend `E100` into `impact` after transient detection. Keep `E400` as a stabilizer between the two.

This multiscale design prevents a single kick from inflating the whole storm and prevents a loud sustained section from looking static.

### 2. Percussive spectral flux → impact

Compute positive spectral flux on the PCEN-normalized mel spectrogram after harmonic-percussive separation:

\[
\Phi(m)=\frac{1}{K}\sum_k \max\bigl(0, S_P(k,m)-\max_{j\in\mathcal N(k)}S_P(j,m-1)\bigr)
\]

Positive differences represent newly arriving spectral energy. A local maximum filter across frequency reduces false onsets from vibrato; this is the SuperFlux form used by `librosa.onset.onset_strength`.[8](#source-8) Onset literature distinguishes an instantaneous onset from the longer attack and transient regions, so keep `impact` as a short envelope rather than a binary trigger.[9](#source-9)

Recommended control:

\[
impact=0.65\,\widehat{\Phi}+0.35\,\widehat{E100}
\]

Use a 25–50 ms attack and 180–320 ms release. Add a 180 ms refractory interval for lightning triggers. Shards may respond to every impact, but lightning should respond only when `impact > 0.78` and the deterministic event gate is open.

### 3. Low-band share → bass mass

\[
B(m)=\frac{\sum_{30\leq f_k<180}P(k,m)}{\sum_{30\leq f_k<8000}P(k,m)+\epsilon}
\]

Map the robust-normalized value to `bassMass`. This channel has one job: perceived physical mass. It controls ocean heave, wall-cloud depth, and slow camera push. It must not trigger lightning or color changes.

### 4. Spectral centroid → brightness

\[
C(m)=\frac{\sum_k f_kP(k,m)}{\sum_kP(k,m)+\epsilon}
\]

The centroid is the spectrum’s weighted mean frequency.[10](#source-10) Convert it to log-frequency before normalization. Use it for sky exposure, edge luminance, and the shift from rust/burgundy toward sky blue and porcelain.

Compute the 85% spectral rolloff as a diagnostic: it is the frequency below which the chosen percentage of spectral energy lies.[11](#source-11) Centroid and rolloff often move together. Do not give both independent renderer knobs in version 1. Keep rolloff in the analysis artifact and replace centroid only if listening and ablation tests show that rolloff follows the intended brightness better.

### 5. Spectral flatness → noisiness

For power bins in 200 Hz–8 kHz:

\[
F(m)=\frac{\exp\left(\frac{1}{K}\sum_k\ln(P(k,m)+\epsilon)\right)}{\frac{1}{K}\sum_k(P(k,m)+\epsilon)}
\]

Flatness approaches 1 for a flat, noise-like spectrum and is lower for concentrated tonal spectra.[12](#source-12) Map it to cloud micro-turbulence, rain angular spread, spray, and glass roughness. Do not map it to gross storm strength. Cymbals, distortion, and broadband production noise can raise flatness without increasing musical importance.

### 6. HPSS energy ratio → coherence

Median-filter harmonic-percussive source separation treats stable horizontal spectrogram structures as harmonic and short vertical structures as percussive.[13](#source-13) Use `kernel_size = (31, 31)`, `power = 2`, and `margin = 1` as a baseline. From the masks, calculate:

\[
H_r(m)=\frac{E_H(m)}{E_H(m)+E_P(m)+\epsilon}
\]

Map robust-normalized `H_r` to `coherence`. High coherence aligns shards into longer orbital ribbons and lengthens reflection trails. Low coherence breaks them into impact-driven debris. This is distinct from flatness: flatness describes spectral distribution within a frame, while HPSS describes time-frequency morphology across neighboring frames.

### 7. Multiscale novelty → weather transition evidence

Create 10 Hz feature vectors from PCEN mel bands plus `pressure`, `bassMass`, `brightness`, `noisiness`, and `coherence`. Build a cosine self-similarity matrix and convolve its diagonal with a checkerboard kernel. Peaks mark changes between locally self-similar regions, following Foote’s audio novelty method.[14](#source-14) Compute two curves:

- `noveltyShort`: kernel half-width 1.5 s. Use it for a 0.5–1.5 s geometry morph.
- `noveltyLong`: kernel half-width 6 s. Use it only as evidence for a weather-mode transition.

Never let novelty alone select `clearing`. It can mark a verse, breakdown, chorus, or production change, but it cannot identify the semantic sea-glass passage. In measured mode, the authored crest cue and `noveltyLong` can be combined to tune the transition start after inspection.

### 8. Predominant local pulse → gated rhythmic motion

Predominant local pulse (PLP) analyzes the onset envelope for locally stable periodicity and yields a continuous pulse curve; the method is designed for varying tempo and also indicates confidence in periodicity.[15](#source-15) Use PLP only for small motions: vortex breathing, shard glints, and rain-sheet modulation.

Estimate `pulseConfidence` as the dominant tempogram peak energy divided by total energy in the 40–240 BPM range, then calibrate it to `[0,1]` on validation material. When confidence is below an initial threshold of `0.55`, set the rendered pulse amplitude to zero. Beat tracking has inherent metrical ambiguity, including half- and double-tempo interpretations, and confidence cannot be assumed for every track.[16](#source-16) Macro weather state, camera cuts, and the crest must never depend on beat output.

### Perceptual and track-relative normalization

Use PCEN on the mel spectrogram before flux and novelty. PCEN applies automatic gain control followed by nonlinear compression and can suppress background variation while emphasizing foreground changes.[17](#source-17) Use it as a robust frontend, not as a psychoacoustic proof.

Normalize each scalar descriptor over the complete track with robust quantiles:

\[
\widehat f(m)=\operatorname{clamp}\left(\frac{f(m)-Q_{10}(f)}{Q_{90}(f)-Q_{10}(f)+\epsilon},0,1\right)
\]

Then apply asymmetric smoothing:

\[
y_m=y_{m-1}+\left(1-e^{-\Delta t/\tau}\right)(\widehat f_m-y_{m-1})
\]

Use a shorter `tau` while the value rises and a longer `tau` while it falls. Suggested starting values are 60/260 ms for impact, 180/600 ms for brightness and noisiness, 350/900 ms for coherence and bass mass, and 700/1800 ms for pressure. These are visual-control parameters, not standardized audio constants.

### Deliberately excluded render inputs

- **STFT phase:** keep it only if later reconstruction or a phase-deviation onset experiment requires it. Raw phase is wrap-sensitive and has no stable, distinct visual job in this design.
- **Spectral rolloff:** retain it for quality control against centroid. Do not expose it as a second brightness knob unless the ablation proves a gain.
- **Global tempo:** omit it. It cannot represent local pulse changes and invites half- or double-tempo errors.
- **MFCC and chroma:** omit them from version 1. They add dimensions but no required weather control. Novelty can use the PCEN mel representation directly.

## Authored-cue provider

The cue author listens through the visible YouTube player and presses marker controls. The application records `getCurrentTime()` and a semantic label. This creates authored data without accessing audio samples.

Use three passes:

1. Mark broad modes: `rain`, `supercell`, and `clearing`.
2. Mark the start, full bloom, and release of the sea-glass lyrical crest.
3. Mark only the largest impact accents that deserve lightning or a shard burst.

No timestamps are supplied here. They must come from an actual listening pass. A cue file should include the authoring method and never use the word “analyzed.”

```ts
type AuthoredCue = {
  timeS: number; // recorded from the visible player
  label: "mode" | "crest" | "impact";
  value: string | number;
  attackS?: number;
  releaseS?: number;
};

type AuthoredSignalFileV1 = {
  version: 1;
  source: "authored";
  media: { provider: "youtube"; id: "s77kCPJC42Y" };
  provenance: { method: "manual-listening-cues"; createdAt: string };
  cues: AuthoredCue[];
};
```

Use cubic smoothstep for every sustained cue:

\[
s(u)=3u^2-2u^3,\qquad u=\operatorname{clamp}\left(\frac{t-t_0}{D},0,1\right)
\]

For the crest, use three joined curves: an authored opening attack of 1.8–3.5 s, a held bloom, and a 3–6 s release. These ranges describe the effect envelope around a manually marked passage; they are not claims about song timestamps.

## Weather-mode integration

Treat each mode as a complete normalized base configuration. Blend the complete configuration during transitions, then apply audio or authored modulation. Do not switch subsystems separately.

| Parameter             | Rain | Supercell | Clearing |
| --------------------- | ---: | --------: | -------: |
| wind                  | 0.35 |      0.90 |     0.25 |
| rain density          | 0.75 |      1.00 |     0.08 |
| cloud opacity         | 0.62 |      1.00 |     0.22 |
| cloud rotation        | 0.20 |      0.92 |     0.12 |
| lightning probability | 0.08 |      0.62 |     0.00 |
| ocean energy          | 0.42 |      0.90 |     0.48 |
| sky openness          | 0.12 |      0.04 |     0.92 |
| reflection strength   | 0.18 |      0.30 |     1.00 |
| shard order           | 0.30 |      0.16 |     0.88 |

These values are proposed starting points. Blend source and target values with `smoothstep` over 2.5–5 s. Keep particle identity and the seeded pseudo-random sequence unchanged across modes so the transition is continuous and reproducible.

Apply the control bus after the base blend:

```ts
wind = sat(base.wind + 0.22 * pressure + 0.18 * bassMass);
rainDensity = sat(base.rainDensity * (0.72 + 0.28 * pressure));
cloudOpacity = sat(base.cloudOpacity + 0.12 * pressure - 0.58 * crest);
cloudRotation = sat(
  base.cloudRotation + 0.24 * pressure + 0.08 * pulse * pulseConfidence,
);
lightningDrive = base.lightningProbability * impact;
oceanEnergy = sat(base.oceanEnergy + 0.32 * bassMass + 0.14 * pressure);
skyOpenness = sat(base.skyOpenness + 0.82 * crest + 0.12 * brightness);
reflectionStrength = sat(
  base.reflectionStrength + 0.72 * crest + 0.18 * coherence,
);
shardOrder = sat(
  base.shardOrder + 0.74 * crest + 0.18 * coherence - 0.22 * impact,
);
```

`sat(x)` clamps to `[0,1]`. The crest dominates cloud opening, sky, reflection, and shard order. Measured descriptors add texture and force but do not compete with the semantic cue.

## Visual mappings

### Supercell geometry

Use three nested, instanced mesh shells rather than a full-screen volumetric ray march. Displace vertices with curl noise and a rotating cylindrical field.

\[
R=4.8+2.4\,pressure,\qquad
y_{wall}=-0.3-1.7\,bassMass
\]

\[
A_{noise}=0.08+0.42\,noisiness+0.22\,impact,\qquad
\omega=0.35+1.8\,pressure+0.35\,pulse\,pulseConfidence
\]

All geometry uses a fixed seed. `noveltyShort` may change noise frequency by at most 20% over its envelope. `noveltyLong` may start a mode transition only when an authored mode cue is present or during a later reviewed analysis pass.

### Shard motion

Render sea glass as instanced low-poly shards. Store each shard’s seed, base orbit, thickness, and orientation in instance attributes. Do not respawn shards during a mode change.

\[
v_{burst}=0.25+3.2\,impact,\qquad
align=shardOrder,\qquad
trail=0.08+0.42\,coherence+0.35\,crest
\]

In supercell mode, low `align` creates a violent debris field. During the crest, orbit normals converge toward the opening and form a reflecting helix. This creates emotional resolution without reducing physical energy.

### Refraction-like material

Use a thin-glass approximation. Start with index of refraction `eta = 1.45`, which gives normal-incidence Fresnel reflectance:

\[
F_0=\left(\frac{\eta-1}{\eta+1}\right)^2\approx0.034
\]

Set roughness to `0.08 + 0.34*noisiness`; set screen-space refraction offset to `0.006–0.025` UV; and cap chromatic separation at `0.003` UV. On mobile, sample one environment map plus one scene-color tap. On desktop, allow three chromatic taps. These values are artistic shader settings, not a material measurement of the depicted glass.

### Ocean and sky

Use four directional Gerstner components on mobile and eight on desktop. Drive total wave amplitude with `oceanEnergy`, but clamp it so the water plane does not intersect the frame. Use `impact` for localized normal ripples, not new geometry.

Interpolate colors in OKLab, not RGB. Proposed anchors are:

- storm burgundy `#4A1828`
- rust `#9B4B34`
- deep teal `#1F6864`
- violet `#5D3B70`
- sky blue `#78C7E8`
- porcelain `#F2EEE8`
- sea-glass green `#68B89F`

Use storm colors for absorption and cloud shadows. Use sky blue and porcelain for opening light. Use sea-glass green for shard transmission and the horizon glow. The palette is derived from the supplied description, not sampled from the unavailable image.

### Anime-influenced force without visual noise

Use one full-screen contour pass and deterministic impact frames. At large `impact`, compress the field of view by at most 2.5 degrees for 70 ms, add a radial line field for 90–140 ms, and limit camera roll to 0.8 degrees. Add a reduced-motion path that removes camera impulse and radial lines while keeping color and geometry response.

## Synchronization

### YouTube authored mode

Sample `getCurrentTime()` every 200–250 ms and extrapolate with `performance.now()` only while state is `PLAYING`. Clamp extrapolation to 250 ms. Render from the extrapolated media clock, not from accumulated animation time.

Keep the YouTube player visible with its attribution and controls. Do not turn it into a hidden background audio source or obscure its player interface; both actions conflict with the current developer policies.[4](#source-4) In the museum framing, the player can live as a visible listening plaque or a deliberate inset outside the artwork portal.

On `PAUSED` or `BUFFERING`, freeze the provider. On `PLAYING`, re-anchor immediately. If the new time differs from the predicted time by more than 150 ms, snap the media clock and crossfade continuous controls over 120 ms. If the time moves backward or jumps by more than 500 ms, treat it as a seek: binary-search the cue list, reset envelopes to their values at the target time, and do not replay elapsed impact or lightning events.

This method supports stable macro cues. It is not sample-accurate and must not drive beat-synchronous impacts. The IFrame API defines elapsed time and state but gives no output timestamp or audio-device latency estimate.[3](#source-3)

### Independent-audio measured mode

If the application later plays an independently supplied audio buffer through Web Audio, use `AudioContext.currentTime` as the scheduling clock. The Web Audio specification defines it in processed sample-frame time and supplies `getOutputTimestamp()` to relate audio context time to `performance.now()`; it also distinguishes processing latency from output latency.[18](#source-18) Schedule visuals against the corresponding audible output time when supported.

For an HTML media element, store an empirical per-device visual offset and expose a calibration control. Do not subtract `currentTime` from `getOutputTimestamp().contextTime` and call the result latency; the specification explicitly warns against that calculation.[18](#source-18)

## Measured analysis artifact

When an independent recording becomes available, run analysis offline and store only derived controls.

```json
{
  "version": 1,
  "source": "measured",
  "mediaId": "sea-glass",
  "audioSha256": "...",
  "sampleRate": 44100,
  "analyzer": {
    "name": "spectral-controls",
    "version": "1.0.0",
    "nFft": 2048,
    "hop": 512,
    "window": "hann",
    "center": false,
    "hpss": { "kernel": [31, 31], "power": 2, "margin": 1 },
    "controlRateHz": 20
  },
  "channels": [
    "pressure",
    "impact",
    "bassMass",
    "brightness",
    "noisiness",
    "coherence",
    "noveltyShort",
    "noveltyLong",
    "pulse",
    "pulseConfidence"
  ],
  "frames": "quantized-or-binary-payload",
  "annotations": { "source": "authored", "crest": [] }
}
```

Export at 20 Hz with linear interpolation in the renderer. Ten unsigned 16-bit channels for 222 seconds are about 89 kB before metadata and compression. Record the exact analyzer version and configuration. Re-running analysis against the same decoded samples must reproduce the same feature artifact hash.

## Failure cases and guards

| Failure                                                 | Consequence                            | Guard                                                              |
| ------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| Loud mastering compresses `E3000`                       | Pressure remains nearly constant       | Track-relative quantiles; preserve authored macro mode             |
| Cymbals or distortion raise centroid and flatness       | Scene becomes falsely bright and noisy | Limit brightness rate; keep centroid and flatness on separate jobs |
| HPSS classifies distorted guitars as percussive         | Shards fragment too often              | Smooth ratio; keep HPSS out of lightning trigger                   |
| Flux reacts to sustained vocal or guitar vibrato        | False impacts                          | Frequency maximum filter, PCEN, threshold, refractory interval     |
| Beat estimate chooses half or double tempo              | Visible pulse feels wrong              | Confidence gate; pulse controls only small motion                  |
| Novelty finds a breakdown rather than the lyrical crest | Wrong clearing transition              | Authored crest remains authoritative                               |
| YouTube buffering or seeking changes the clock          | Late or replayed cues                  | State-aware re-anchor, seek reset, no retroactive impulses         |
| Mobile overdraw from rain, clouds, and glass            | Thermal throttling and frame drops     | Tiered counts, half-resolution atmosphere, dynamic resolution      |
| Cross-device GPU arithmetic differs                     | Pixel hashes diverge                   | Verify control-bus determinism; use perceptual image tolerance     |

## Mobile rendering budget

Treat these as acceptance targets, not universal hardware facts.

- Primary tier: 60 fps, 16.7 ms total frame; target ≤10 ms GPU and ≤4 ms CPU with 2 ms reserve.
- Low tier: stable 30 fps, 33.3 ms total frame.
- Cap mobile device pixel ratio at 1.5. Allow dynamic render scale from 0.65 to 1.0.
- Use 96 shards mobile and 256 desktop. Use one instanced draw.
- Use 2,000 rain streaks mobile and up to 7,000 desktop. Fade by depth to reduce overdraw.
- Use three cloud shells mobile and five desktop. Render atmosphere at half resolution.
- Use four Gerstner waves mobile and eight desktop.
- Use one contour/post pass mobile. Disable planar reflection on mobile; use the sky environment and Fresnel instead.
- Keep mobile visible triangles below an initial 250,000 and draw calls below 60. Measure before increasing either.
- Prewarm shader variants. Keep random state in integer hashes or a named seeded generator.

Degrade in this order: chromatic glass taps, rain count, atmosphere resolution, cloud shell count, shard count, then internal resolution. Do not degrade cue timing, sky opening, or crest color.

## Experiment and validation plan

### Experiment A — authored cue prototype

**Question:** Can a small manual cue set create a convincing, repeatable crescendo without PCM access?

**Smallest useful action:** Perform the three authoring passes, save the cue file, and replay the complete track three times with pause, resume, and seek tests.

**Observable results:**

- No cue fires while paused or buffering.
- Seek does not replay past lightning or burst events.
- The supercell-to-clearing transition is continuous.
- The crest makes sky, reflection, and shard order rise together while pressure may remain high.
- The renderer displays `AUTHORED CUES` in diagnostics.

**Acceptance targets:** p95 macro-cue timing error below 120 ms after re-anchor; no frame hitch above 100 ms after shader warmup; no mode-transition discontinuity in any normalized parameter above 0.05 per rendered frame.

**Stop condition:** If the crest still feels generic after one cue-timing revision, adjust the visual mapping and envelope shape. Do not add more low-level controls.

### Experiment B — lawful measured provider

**Question:** Which measured features add visible evidence beyond the authored timeline?

**Smallest useful action:** Analyze one independently supplied recording. Hand-mark 20–30 salient impacts, 4–8 large section boundaries, and the semantic crest. Run four ablations:

1. multiscale energy only;
2. add percussive flux and HPSS;
3. add centroid and flatness;
4. add novelty and gated PLP.

**Metrics:** impact F1 within ±70 ms; median boundary distance within 1 s; false lightning count; p95 control derivative; and blind 1–5 ratings for impact alignment, macro arc, crest clarity, and visual stability. The ±70 ms onset window is consistent with a common beat-evaluation tolerance and is a strict visual target rather than a guarantee.[19](#source-19)

**Decision rule:** Keep a feature only if it improves its assigned rating by at least 0.3/5 or improves its objective event metric by at least 10% relative, without increasing false dramatic events by more than 5%. Otherwise remove it or retain it as a diagnostic.

### Experiment C — reproducibility and performance

**Question:** Does the same evidence produce the same control and a stable visual result?

**Action:** Replay fixed checkpoints under the same cue or feature file and seed on desktop and one mid-range mobile device.

**Acceptance targets:** identical feature artifact hash; control values equal within `1e-6` on the same JavaScript engine; perceptual screenshot difference below a chosen SSIM threshold across GPU vendors; p95 frame time below the selected tier budget during a 10-minute loop; zero unbounded particle or buffer growth.

## Implementation order

1. Freeze `ControlFrameV1` and the three weather base configurations.
2. Implement `YouTubeClock` with pause, buffer, seek, and re-anchor behavior.
3. Implement `AuthoredCueProvider` and the three-pass marker workflow.
4. Route all weather, shard, ocean, and sky parameters through the control bus.
5. Add deterministic seed handling and the mobile degradation ladder.
6. Validate Experiment A. Do not wait for an independent audio file.
7. When a lawful independent recording arrives, build the offline analyzer and `MeasuredFeatureProvider`.
8. Run the ablation plan. Remove features that do not earn a distinct visual job.

The first review condition is concrete: one full playback must produce a continuous supercell-to-clearing crest with authored labeling, correct pause/seek behavior, and stable mobile frame pacing. Spectral measurement begins only after an independently supplied recording exists.

## Sources

1. <a id="source-1"></a>Driveways. [“Sea Glass.”](https://driveways.bandcamp.com/track/sea-glass) _Tempest_. November 22, 2024.
2. <a id="source-2"></a>YouTube. [oEmbed metadata for `s77kCPJC42Y`.](https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Ds77kCPJC42Y&format=json) Accessed September 14, 2026.
3. <a id="source-3"></a>Google for Developers. [“YouTube Player API Reference for iframe Embeds.”](https://developers.google.com/youtube/iframe_api_reference) Accessed September 14, 2026.
4. <a id="source-4"></a>Google for Developers. [“YouTube API Services — Developer Policies.”](https://developers.google.com/youtube/terms/developer-policies) Accessed September 14, 2026.
5. <a id="source-5"></a>librosa. [`librosa.stft` documentation.](https://librosa.org/doc/main/api/generated/librosa.stft.html) Accessed September 14, 2026.
6. <a id="source-6"></a>International Telecommunication Union. [Recommendation ITU-R BS.1770-5: “Algorithms to measure audio programme loudness and true-peak audio level.”](https://www.itu.int/rec/R-REC-BS.1770) November 2023.
7. <a id="source-7"></a>European Broadcasting Union. [“Loudness.”](https://tech.ebu.ch/loudness) EBU Mode time windows and R 128 resources. Accessed September 14, 2026.
8. <a id="source-8"></a>librosa. [`librosa.onset.onset_strength` documentation.](https://librosa.org/doc/0.11.0/generated/librosa.onset.onset_strength.html) Accessed September 14, 2026.
9. <a id="source-9"></a>Juan Pablo Bello et al. [“A Tutorial on Onset Detection in Music Signals.”](https://hans.fugal.net/comps/papers/bello_2005.pdf) _IEEE Transactions on Speech and Audio Processing_ 13(5), 2005. DOI: 10.1109/TSA.2005.851998.
10. <a id="source-10"></a>librosa. [`librosa.feature.spectral_centroid` documentation.](https://librosa.org/doc/0.10.2/generated/librosa.feature.spectral_centroid.html) Accessed September 14, 2026.
11. <a id="source-11"></a>librosa. [`librosa.feature.spectral_rolloff` documentation.](https://librosa.org/doc/main/generated/librosa.feature.spectral_rolloff.html) Accessed September 14, 2026.
12. <a id="source-12"></a>librosa. [`librosa.feature.spectral_flatness` documentation.](https://librosa.org/doc/0.9.2/generated/librosa.feature.spectral_flatness.html) Accessed September 14, 2026.
13. <a id="source-13"></a>Derry FitzGerald. [“Harmonic/Percussive Separation Using Median Filtering.”](https://dafx.de/paper-archive/2010/DAFx10/DerryFitzGerald_DAFx10_P15.pdf) Proceedings of DAFx-10, 2010.
14. <a id="source-14"></a>Jonathan Foote. [“Automatic Audio Segmentation Using a Measure of Audio Novelty.”](https://citeseerx.ist.psu.edu/document?doi=ad9065b889987b2578bc33a8272b34b42d15fb98&repid=rep1&type=pdf) Proceedings of ICME, 2000. DOI: 10.1109/ICME.2000.869637.
15. <a id="source-15"></a>Peter Grosche and Meinard Müller. [“Extracting Predominant Local Pulse Information from Music Recordings.”](https://doi.org/10.1109/TASL.2010.2096216) _IEEE Transactions on Audio, Speech, and Language Processing_ 19(6), 2011.
16. <a id="source-16"></a>José R. Zapata et al. [“Assigning a Confidence Threshold on Automatic Beat Annotation in Large Datasets.”](https://ismir2012.ismir.net/event/papers/157_ISMIR_2012.pdf) Proceedings of ISMIR, 2012.
17. <a id="source-17"></a>Yuxuan Wang et al. [“Trainable Frontend for Robust and Far-Field Keyword Spotting.”](https://arxiv.org/abs/1607.05666) ICASSP, 2017.
18. <a id="source-18"></a>W3C. [“Web Audio API.”](https://www.w3.org/TR/webaudio-1.0/) W3C Recommendation, June 17, 2021.
19. <a id="source-19"></a>Matthew E. P. Davies and Sebastian Böck. [“Evaluating the Evaluation Measures for Beat Tracking.”](https://www.cp.jku.at/research/papers/Davies_Boeck_ISMIR_2014.pdf) Proceedings of ISMIR, 2014.
