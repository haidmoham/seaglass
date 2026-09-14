# Weather inference design

## Decision

Keep the existing local FFT analysis for the first Rain / Storm / Clearing recommendation. Do not add Meyda yet.

The current job needs a few explainable aggregate signals, such as low-band share, high-band share, overall energy, and change over time. The existing analysis already owns those values. Adding a feature library would increase bundle and integration cost without making a three-label heuristic accurate.

Meyda is a good later option if visual review shows that the current features cannot distinguish the intended examples. Its standardized extractors include RMS, spectral centroid, flatness, flux, rolloff, spread, loudness, and perceptual sharpness. Those measurements can describe loudness, brightness, noisiness, and spectral change. They do not classify mood or weather by themselves.

## Inference boundary

This feature is a rule-based visual recommendation for a user-supplied local audio file.

- It is not a trained classifier.
- It has no measured classification accuracy.
- It does not infer emotion, lyrical meaning, genre, or meteorological truth.
- It cannot analyze an embedded YouTube recording through the iframe player API.
- It should use aggregate windows across the decoded file. A single loud frame is not evidence for the whole song.
- Input level, mastering, silence, file length, and section changes can move the result. Normalize within the file and require enough non-silent material before recommending a mode.

Call the output a **suggestion**, not a prediction or detection.

## Explainable heuristic

Return a result with four fields:

```text
mode: Rain | Storm | Clearing
strength: Clear | Close call | Insufficient signal
reasons: two short measured observations
scores: internal normalized scores for all three modes
```

Use the scores only to rank the modes. Do not display them as probabilities. “72% Storm” would imply calibration that does not exist.

A practical first rule set:

- **Storm:** higher median energy, stronger low-band share, and more large frame-to-frame energy changes.
- **Rain:** moderate energy, relatively broad high-band activity, and sustained texture with fewer large attacks.
- **Clearing:** lower median energy, lower attack density, and more stable or sparse frames.

Each reason should name the measured behavior, for example “strong low-band energy” or “few large level changes.” Avoid interpretive reasons such as “sounds threatening.”

Mark the result **Close call** when the winning score has a small margin over the runner-up. Mark it **Insufficient signal** for decoding failure, very short audio, mostly silent audio, invalid values, or too few usable frames. In those cases, preserve the current weather and show the manual controls.

## Interaction

Use an inspectable recommendation card after local analysis:

```text
Suggested weather                         Close call
STORM
Strong low-band energy · frequent level changes

[Apply Storm]   [Rain] [Storm] [Clearing]
```

- Keep the suggested mode, uncertainty label, and two reasons visible together.
- Do not change the scene until the user selects **Apply**. This makes the recommendation easy to inspect and prevents analysis from overwriting an authored choice.
- Keep all three manual weather buttons beside the action. A manual selection applies immediately and records the displayed state as “Manual.”
- After manual selection, keep the last suggestion visible in subdued text so the user can compare it with the chosen mode.
- A new file starts a new analysis request. Ignore a delayed result from an older file.
- If analysis fails, show the concrete failure and retain working manual controls.
- Announce completion through a polite status region. Keep focus on the file control or the action the user selected.

This adapts the project’s existing pattern of an automatic result with a visible override. The interface shows what the system chose, why it chose it, and what the user actually applied.

## Validation cases

Use synthetic and hand-inspected local fixtures to verify behavior, not accuracy:

- silence and near-silence produce **Insufficient signal**;
- invalid samples never produce `NaN` or a mode;
- a low sine plus strong amplitude attacks ranks Storm above Clearing;
- broad high-frequency noise at moderate level can rank Rain without claiming that all noise is rain;
- a quiet stable tone can rank Clearing;
- two similar top scores display **Close call**;
- manual selection survives a stale analysis result;
- Apply changes weather but never changes playback time;
- the reasons correspond to the values used by the rule.

Real music fixtures should be used only to tune thresholds and inspect failure modes. A few agreeable examples do not establish general accuracy.

## Meyda reuse assessment

Meyda is an MIT-licensed JavaScript audio feature extraction library. Its documentation supports offline and Web Audio extraction. The MIT notice must remain with copied or substantial portions of its software.

Useful future features are:

- spectral centroid for a measured brightness axis;
- spectral flatness for tonal versus noise-like texture;
- spectral flux for change between adjacent spectra;
- RMS or perceptual loudness for level;
- rolloff or spread for bandwidth.

Important integration details include matching the window function when comparing results and choosing an application-specific normalization method. Meyda defaults to a Hanning window. Several feature ranges depend on buffer size, sample rate, source level, or the analyzed corpus.

Adopt Meyda only if a named feature resolves a documented failure of the existing FFT heuristic. If adopted, use it as a feature calculator behind the project’s own typed analysis boundary. Keep the weather rules, thresholds, uncertainty, and user-facing reasons in project code.

## Sources

- Meyda repository and MIT license: `meyda/meyda`, reviewed at `ecf2566`.
- Meyda audio feature reference and offline extraction guide, reviewed 2026-09-14.
- Private design vocabulary consulted at `993c77d`; only its general inspectable-result and visible-override interaction was adapted here. No private library content is intended for public UI copy.
