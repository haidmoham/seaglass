# Local verification — 2026-09-14

## Passed

- TypeScript project check and Vite production build.
- Oxlint with the explicit Poneglyph plugin configuration. A temporary invalid
  type-alias probe confirmed that the plugin rules execute; the probe was removed.
- Five synthetic audio tests: low sine, high sine, silence, silence-to-signal
  onset/smoothing, and invalid input.
- Fresh desktop gallery render, enter/return, drag orbit, authored crescendo,
  manual weather selection, and reduced-motion default.
- A 390 × 844 nested viewport exercised the actual narrow CSS and canvas sizing.
  Its document scroll width was 390 px. The pinned player measured about
  200 × 200 px. Entry, rain selection, drag, resume, and freeze were exercised.
- The initial overly dark/cropped canopy was corrected through camera framing,
  geometry scale, and explicit tone mapping/color-space conversion in shaders.
- A hot-reload context-loss failure was corrected by disposing renderer resources
  without forcing context loss on a canvas React can reuse.

## Limits

The responsive check is a browser viewport check, not a physical phone GPU or
touch-device performance measurement. No frame-rate guarantee is claimed.

The local Codex in-app browser did not complete the YouTube iframe handshake.
The same song loaded on the HTTPS soundspace reference. Local playback and
seek-to-visual synchronization could therefore not be verified end to end.
The adapter has a bounded retry and a visible link to the original YouTube song.
The precise local embed restriction remains unknown.

The artwork uses provisional authored cues. No Sea Glass audio was analyzed,
and no musical section or lyrical crescendo timestamp has been verified.
The separate spectral research report is a proposal for the next experiment.

Vite reports a large-chunk advisory for the Three.js bundle. The production
bundle is approximately 214 kB compressed. This is not a measured load time.
