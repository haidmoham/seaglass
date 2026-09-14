# Basic Music Reactivity for Sea Glass

## Decision

Add three authored control channels to the existing scene: `pressure`, `bassPulse`, and `impact`. Give each channel one visible job. Use asymmetric attack and release envelopes so the storm reacts quickly and settles smoothly. Keep weather mode and the lyrical clearing under authored semantic control.

The current YouTube integration provides playback state and elapsed time. It does not provide decoded audio samples through the documented IFrame API. Therefore, the first version must describe its pulse and impact grid as **authored**, not measured, beat-detected, spectral, or tempo-synchronized.[1](#source-1)

## Research findings

### Frequency data needs temporal smoothing

For a later measured-audio provider, Web Audio's `AnalyserNode` supplies FFT frequency data. The specification applies a Blackman window, Fourier transform, temporal smoothing, and dB conversion. Its smoothing rule blends the previous spectrum with the current magnitude through `smoothingTimeConstant`; the default value is `0.8`.[2](#source-2)

This supports two practical choices:

- Smooth a sustained energy control before it reaches geometry. Raw frame values will flicker.
- Use separate rise and fall rates in the render control layer. A quick rise preserves impact. A slower fall gives the eye time to read the response.

The built-in analyser smoothing is symmetric. The scene should add an asymmetric causal envelope:

```ts
const tau = target > current ? attackSeconds : releaseSeconds;
const blend = 1 - Math.exp(-deltaSeconds / tau);
current += (target - current) * blend;
```

Start with `attack = 0.035 s, release = 0.24 s` for `impact`, and `attack = 0.12 s, release = 0.65 s` for `pressure` and `bassPulse`. These are visual tuning values. They are not properties measured from Sea Glass.

### An onset is an event, not a sustained wobble

Bello and colleagues distinguish onset, attack, transient, and decay. Their tutorial describes common onset functions based on sudden energy or short-time spectral change.[3](#source-3) A scene should treat an onset-like cue as a short event envelope rather than route it into every continuous parameter.

Use impact accents for discrete, local responses:

- raise sea-glass edge emission for 120–220 ms;
- push a small seeded debris arc outward, then let it return through damping;
- reveal one spatial lightning branch only after a 350 ms refractory period.

Do not scale the clouds, ocean, glass, camera, and rain together on every accent. That produces a global wobble and hides the event hierarchy.

### Low-frequency energy should communicate physical mass

A future measured provider can sum FFT-bin power over a low band and normalize it against broader-band energy. The FFT data needed for this calculation is part of the Web Audio analyser interface.[2](#source-2) Low-frequency energy has a clear visual role here: mass moving through water and cloud structure.

Map `bassPulse` to two related outputs:

- ocean radial-wave amplitude: `base * (1 + 0.18 * bassPulse)`;
- supercell shelf breathing: horizontal scale `base * (1 + 0.025 * bassPulse)`.

Keep the scale range small. The radial ocean response should carry most of the motion. It has a fixed center at the sea-glass specimen, so the mapping reads as force passing through the exhibit instead of arbitrary object inflation.

## Bounded proposal

Use one renderer input that does not depend on how the signal was produced:

```ts
type ReactivityFrame = {
  source: "authored" | "measured";
  pressure: number;
  bassPulse: number;
  impact: number;
  impactId: number;
};
```

All scalar values are clamped to `[0, 1]`. `impactId` changes only for a new event. This prevents a 60 fps render loop from firing the same lightning or debris accent many times.

Apply the channels after weather-profile interpolation:

| Control        | Primary visual job                                   | Range        |
| -------------- | ---------------------------------------------------- | ------------ |
| `pressure`     | cloud rotation speed and rain fall speed             | up to +18%   |
| `bassPulse`    | ocean radial-wave amplitude and shelf breathing      | +18% / +2.5% |
| `impact`       | glass edge emission envelope                         | up to +45%   |
| new `impactId` | one seeded debris impulse; optional branch lightning | one event    |

The smallest implementation is one authored cue module and one scene method:

```ts
scene.setReactivity(frame);
```

The authored provider samples media time only while YouTube reports `PLAYING`. It evaluates a small, fixed pulse grid and explicit accent list. It must not display BPM, beat detection, low-frequency analysis, or spectral analysis. The IFrame API documents `getCurrentTime()` and player states such as playing, paused, and buffering; these are enough for repeatable authored cues but not for audio measurement.[1](#source-1)

On pause, freeze the media-time cue provider and let active visual envelopes release only if the product intends ambient motion to continue. On seek, recompute sustained controls at the destination and clear event history. Do not replay accents crossed by the seek.

## Pitfalls and guards

- **False evidence:** A regular authored pulse can resemble beat tracking. Label diagnostics `AUTHORED REACTIVITY`. Make no measured tempo claim.
- **Global wobble:** A single energy value routed everywhere makes the scene feel elastic. Preserve the distinct jobs in the mapping table.
- **Frame-rate dependence:** Use delta-time exponential envelopes and integrated phase. Do not add a fixed amount per frame.
- **Pause or seek bursts:** Key events by `impactId`, reset event state after a seek, and never scan through skipped intervals.
- **Lightning fatigue:** Use a refractory interval and seeded branch choice. Keep the effect inside the artwork. Do not flash the viewport.
- **Mobile legibility:** Keep shelf breathing below 2.5%. Prefer shader amplitude changes over adding geometry or particles.
- **Invisible response:** Test at 25%, 100%, and 150% storm intensity. The sea-glass emission and ocean ring must remain visible against each weather palette.

## Implemented state

The scene already has continuous ambient motion for clouds, rain, ocean, glass, and debris. It also accepts authored energy and weather values. The YouTube player supplies time and playback state. A time-authored pulse grid exists, but it is not measured audio evidence.

The three-channel `ReactivityFrame`, asymmetric envelopes, event identity, and the mappings in this note are proposed work. This document does not claim that they are implemented.

## Review condition

Play one full authored cue pass and inspect three moments: low activity, one large accent, and the clearing crescendo. Keep the feature only if a viewer can identify the response without watching the controls and the scene remains stable during pause, resume, and seek. Stop after one tuning pass if the mapping remains ambiguous; revise the assigned visual job before adding more features.

## Sources

1. <a id="source-1"></a>Google for Developers. [YouTube IFrame Player API Reference](https://developers.google.com/youtube/iframe_api_reference). The documented interface supplies playback state and elapsed time through `getPlayerState()` and `getCurrentTime()`.
2. <a id="source-2"></a>W3C. [Web Audio API, section 1.8: `AnalyserNode`](https://www.w3.org/TR/webaudio-1.0/#AnalyserNode). The specification defines FFT windowing, frequency data, and temporal smoothing.
3. <a id="source-3"></a>Juan Pablo Bello et al. [“A Tutorial on Onset Detection in Music Signals”](https://hans.fugal.net/comps/papers/bello_2005.pdf). _IEEE Transactions on Speech and Audio Processing_ 13(5), 2005. DOI: 10.1109/TSA.2005.851998.
