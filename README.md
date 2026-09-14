# Sea Glass

A framed procedural world, seeded with **Sea Glass by Driveways**. Search for a
song, select it, then **just hit play**. Drag the scene to orbit. Drag the handle
above the YouTube player to move it; the reset arrow returns it to the corner.
The handle also supports arrow keys. Pointer capture supports mouse and touch.

The three weather modes are Sun (happy and upbeat), Storm (intense and sad), and
Snow (chill and introspective). These are artistic mappings, not measured emotions.
The separate background blob never appears inside the framed or entered world.
The entrance uses heavy sans typography and ideas from Tiramisu. The search flow
uses Soundspace as a reference. No prior application implementation was copied.

Live: [shin86.dev](https://seaglass.shin86.dev),
[mhaider.dev](https://seaglass.mhaider.dev),
[Vercel](https://seaglass-exhibit.vercel.app).

## Run and deploy

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5173
npm run lint
npm test
npm run build
npx wrangler deploy
npx vercel --prod
```

Vite proxies `/api` to the deployed shin86 endpoint. Cloudflare serves both custom
domains with a Worker and static assets. Vercel serves the same frontend with a
Node search function. Credentials remain outside this repository.

## Search

`GET /api/search?q=...` proxies the existing public Soundspace Railway search
service. It validates results with Zod, removes duplicate video IDs, limits the
response to twelve tracks, and times out after eight seconds. Search runs on
submit. Selecting a result cues the video without autoplay. The iframe supplies
duration after selection. Search does not infer mood from titles.

This depends on Soundspace's availability and quota. No YouTube API key is shipped
in the frontend. See [provider notes](docs/search-provider-notes.md).

## Playback weather

Press **use tab audio** in a supported desktop browser. Select the playing tab
and enable audio sharing. The browser may request video as part of tab sharing;
the app processes only its audio track. Samples stay local. It does not record,
upload, echo, or access PCM through the YouTube iframe.

A 2048-sample snapshot every 200 ms feeds the FFT/RMS/band analyzer. A four-second
rolling window feeds the weather heuristic. Three matching votes and eight seconds
between changes prevent rapid switching. Silence holds weather. Pause, selection,
and seeking reset the analysis window. Manual weather disables automatic changes.
Stop sharing releases the stream and audio context.

This is an untrained rule system. Spectral balance, level, and changes in band
energy are tone proxies. They do not establish happiness or sadness. Actual shared
tab audio still needs a browser permission test; synthetic logic tests alone do
not establish classification accuracy on songs.

The separate **audio file** control analyzes a local file, with a 30 MB and ten-minute
limit. Files stay in the browser. It does not replace the YouTube recording.

The artwork's rhythmic pulses remain authored/synthetic playback envelopes.
Live analysis changes weather; it does not make those pulses measured percussion.
YouTube provides transport and time through its official iframe API.

## Modules

- `src/components/`: entrance, search, live audio control, and draggable player.
- `src/music/`: selected track, YouTube lifecycle, and authored envelopes.
- `src/audio/`: FFT, local file analysis, and live tab analysis.
- `src/weather/`: heuristic inference and visual modes.
- `src/scene/`: Three.js geometry, shaders, camera, and GPU cleanup.
- `src/server/`: validated search adapter and Cloudflare entry point.
- `api/search.ts`: Vercel entry point.

Generic anti-slop rules from the requested Poneglyph source are vendored under
`tools/oxlint/anti-slop/` and enabled as errors. No classifier code was copied.
This fan experiment is not affiliated with Driveways.

## Evidence

See [verification](docs/search-playback-verification.md). The
[spectral crescendo research](docs/spectral-crescendo-research.md) remains a
proposal beyond this baseline. Next: share real tab audio and compare weather
changes across upbeat, intense, and quiet passages. Musical fit remains an
observation to make, not a claim from passing tests.
