# Sea Glass — exhibit 001

A fresh experiment for **Sea Glass by Driveways**, from _Tempest_ (2024).
The frame is an entrance into a procedural storm. This is one song-specific
artwork, not a music search engine or an automatic music-to-world generator.

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
