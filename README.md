# Sea Glass — exhibit 001

A fresh experiment for **Sea Glass by Driveways**, from _Tempest_ (2024).
The frame is an entrance into a procedural storm. This is one song-specific
artwork, not a music search engine or an automatic music-to-world generator.

The entrance adapts [Tiramisu's](https://tiramisu.shin86.dev/) pigment field,
teal title plaque, and thin frame. An original procedural blob responds to
pointer position and authored playback envelopes in a separate page-background
canvas. It never overlays the framed scene or entered world. Freeze holds its
decorative motion. No Tiramisu source code or assets were copied.

The three tone directions are **Sun** (happy and upbeat), **Storm** (intense and
sad), and **Snow** (chill and introspective). Sun opens a warm, dry sky; Storm
contains the mesocyclone and driving rain; Snow has slow drifting flakes and
pale, calm surroundings. These are artistic directions. The inference rules use
signal traits as proxies and do not measure happiness, sadness, or introspection.

Live: [shin86.dev](https://seaglass.shin86.dev),
[mhaider.dev](https://seaglass.mhaider.dev), and
[Vercel](https://seaglass-exhibit.vercel.app).

Motion starts enabled: rain, ocean, cloud rotation, and glass drift share the
scene clock. Freeze pauses this motion; Resume continues from that state.

Playback also drives a provisional authored rhythm: glass expansion, a delayed
ocean response (160 ms), cloud-edge accents, and glass shimmer. These are
synthetic control envelopes, not detected bass or percussion. The iframe clock
is interpolated between updates; paused or stale playback releases the response.
The rhythm module has five deterministic tests in addition to the audio tests.

## Deploy

Run `npm run build`, then `npx wrangler deploy` for the two Cloudflare custom
domains. Run `npx vercel --prod` for the linked Vercel project. Both serve the
same static Vite app. Provider credentials stay outside this repository.

## Run

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open http://127.0.0.1:5173. Use a phone-sized viewport to inspect the narrow
layout. Enter the frame, drag the artwork, or focus it and use arrow keys.
The YouTube player remains visible in a corner. Browser playback requires a tap.

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Ownership boundaries

- `src/App.tsx` and `src/components/` own the museum and playback controls.
- `src/scene/` owns Three.js objects, shaders, camera input, and GPU cleanup.
- `src/weather/` owns weather modes and transitions.
- `src/music/youtube.ts` owns the YouTube player lifecycle and playback clock.
- `src/music/cues.ts` owns provisional, hand-authored cues for this song.
- `src/audio/` owns independent audio decoding and deterministic PCM analysis.

## Song weather inference

Open **Song weather** to analyze a local MP3/WAV or another browser-supported
audio file. Files stay in the browser. The decoder resamples to 16 kHz and
samples up to twelve two-second excerpts across the recording. A worker runs
the existing FFT; a separate heuristic ranks Snow, Storm, and Sun from
level, spectral balance, and changes in the spectrum. The 30 MB and ten-minute
limits keep this first implementation bounded.

Scores express rule fit, not probabilities. This is an untrained artistic
mapping; mastering level, spectral mix, and excerpt selection can change its
choice. It does not infer lyrics or emotional meaning. Silence receives no
weather. Close rankings are marked ambiguous. Synthetic examples demonstrate
the controls and are not evidence of accuracy on songs.

Apply uses the selected weather in this exhibit and turns off the authored
weather timeline. It does not replace the YouTube song. Manual weather choices
and Follow authored score remain available. No YouTube audio is analyzed.

The GitHub review considered [Meyda](https://github.com/meyda/meyda), an MIT
licensed feature extractor. This version reuses the existing FFT rather than
adding a second extractor. No third-party classifier code was copied.

The scene does not read the YouTube iframe. It receives control values through
its explicit API. Playback time is the synchronization authority; camera and
weather inspection remain available without playing audio.

## What the first version can prove

The storm uses **authored cues**, not FFT results from YouTube. Cue names and
times are provisional art direction, not verified musical section annotations.
The visual intensity control changes the artwork; it does not measure loudness.

The separate analysis module performs a Hann-window FFT on an independently
supplied recording. It measures RMS, low/mid/high energy, and positive spectral
flux. Its synthetic tests verify signal behavior. No independent recording of
Sea Glass has been supplied, so this prototype makes no claim to have analyzed
the track. The module is deliberately not connected to the authored cue clock.

YouTube's iframe provides transport controls and playback time, not PCM samples.
Do not extract or capture its audio to bypass that boundary. See the
[IFrame API](https://developers.google.com/youtube/iframe_api_reference).

## Sources and scope

- Music playback: [official YouTube topic upload](https://www.youtube.com/watch?v=s77kCPJC42Y).
- Song identity: [Driveways on Bandcamp](https://driveways.bandcamp.com/track/sea-glass).
- Frame-to-world reference: [wintery](https://wintery.shin86.dev), observed in the browser.
- Weather-choice reference: [soundspace](https://soundspace.shin86.dev), observed in the browser;
  repository located at [haidmoham/soundspace](https://github.com/haidmoham/soundspace).
- User-provided images supplied the autumn context and teal, burgundy, violet,
  rust, sky-blue, and porcelain palette. The later storm direction takes precedence.

No prior application source was read or copied. The visual geometry and shaders
were written for this experiment. The generic anti-slop lint plugin was fetched
from the explicitly requested Poneglyph source under
`skills/operators/deslop-code/assets/anti-slop`; all copied blobs were verified.
The plugin is vendored under `tools/oxlint/anti-slop/` and all generic rules are
enabled as errors. This local fan experiment is not affiliated with Driveways.

## Next evidence-producing step

The [spectral crescendo research](docs/spectral-crescendo-research.md) describes
the future measured pipeline, its equations, source evidence, and ablation plan.
That report is a proposal, not a list of implemented features. The current
analyzer implements the simpler FFT/RMS/band/flux baseline described above.

The current weather profiles share seeded geometry and smooth, independent
controls for precipitation, cloud structure, wind, ocean, and light. “Follow
authored score” selects modes from the provisional song timeline. Manual weather
selection overrides that score. “Preview crescendo” enters clearing without
moving playback time. This visual preview does not claim to identify the actual
lyrical crescendo.

Compare the framed view, storm interior, and clearing crescendo on an actual
phone with headphones. Judge whether entering the frame changes the experience,
whether each weather mode has a distinct identity, and whether the glass remains
the focus. Then validate authored timing by listening, or supply an independent
recording for measured features. Technical checks do not establish musical or
artistic success.
