# Search, playback, and dock verification — 2026-09-14

- Lint, 26 tests, and production build passed. Existing large-bundle advisory remains.
- Both custom HTTPS domains and Vercel return the current frontend asset with HTTP 200.
- All three `/api/search` endpoints return Driveways Sea Glass as the first of twelve results.
- Vercel initially failed on an extensionless ESM import. Runtime logs identified
  ERR_MODULE_NOT_FOUND. An explicit `.js` import fixed the deployed endpoint.
- In the deployed browser, searched Driveways Sea Glass and selected October Forever.
  Display title, YouTube link, embed title, and duration updated. Just hit play entered
  the world. Playback advanced to thirteen seconds. Paused after verification.
- Local browser pointer drag moved the dock from (316,726) to (96,438).
  Reset returned it to (316,726). Touch uses the same pointer path but was not
  tested on physical phone hardware. Arrow-key and viewport clamp paths are implemented.
- Live weather vote/hold/reset tests pass. No actual tab audio permission was granted
  during this verification. Shared audio, mobile support, and real-song classification
  accuracy are not claimed as verified.

Cloudflare version: aa63f454-cc45-425d-84b8-1cd5bdb3e005.
Vercel deployment: dpl_GcLcg5TVRXM8RCPSKXHg3E3qckyR.
Frontend: index-DckN2UO7.js and index-CdJ9Prdi.css.
