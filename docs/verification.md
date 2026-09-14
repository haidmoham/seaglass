# Local verification — 2026-09-14

## Basic authored reactivity — 2026-09-14

- Added bounded bass-like, accent, and shimmer envelopes evaluated from playback
  time. They are authored at a provisional grid, not measured from the song.
- Glass responds first; the ocean receives a 160 ms delayed envelope. The
  Jellyfish documentation inspired this local-response/delayed-response relation.
  Spring physics and true frequency analysis remain proposals, not this feature.
- Ten tests pass (five audio-analysis tests plus five authored-envelope tests).
  Configured lint and TypeScript/Vite build pass.
- The first reactive public build rendered without captured console errors and
  YouTube playback advanced. The final delayed-wave build returned HTTP 200 on
  both custom domains and Vercel, with `index-BioqOAGc.js` on all three.
- Research notes distinguish source evidence, candidate design units, and future
  work. No musical alignment or listening-quality claim is made for the grid.

## Public deployment and motion — 2026-09-14

- Motion now starts enabled at the user's request. Cloud layers counterrotate,
  glass drifts, and rain, ocean, and debris advance through the scene clock.
  Freeze and Resume remain available and were exercised on the live site.
- TypeScript/Vite build, configured Oxlint, and all five audio tests passed
  after the motion change.
- Cloudflare serves `https://seaglass.shin86.dev` and
  `https://seaglass.mhaider.dev`. Vercel serves
  `https://seaglass-exhibit.vercel.app`. All three returned HTTP 200 for the
  page, JavaScript, and stylesheet from the same production build.
- The public shin86.dev site initialized YouTube. Play reported “Playing from
  YouTube” and its clock advanced from 0:11 through 0:27. Pause was observed.
- The authored “After the storm” button sought to 3:15. Keyboard Home returned
  the timeline and chapter to 0:00. With Follow authored score enabled, keyboard
  End selected Clearing and displayed the “Your Light” cue. This verifies
  playback-clock synchronization, not the musical accuracy of authored timing.
- The pinned YouTube player remained visible in the narrow immersive layout.

The earlier localhost handshake limitation below does not block the HTTPS
deployment. These are browser checks, not physical phone or listening tests.

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
