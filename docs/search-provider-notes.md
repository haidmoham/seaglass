# Search provider decision — 2026-09-14

Sea Glass reuses the public Soundspace service through a same-origin server proxy:
`https://soundspace-api-production-274d.up.railway.app/api/youtube/search?q=...`.
Its origin was found in public Vercel frontend configuration. No secret or prior
application implementation was read. Soundspace README and deployment metadata
were inspected; the UX was observed in the browser.

The observed response contains `tracks` with `youtubeVideoId`, `title`, `artists`,
`album`, and `artworkUrl`. Duration is absent. The iframe supplies it after cueing.
The service permits Soundspace's origin, so our browser calls `/api/search` and
our backend calls Railway. No additional provider credential is needed.

The adapter validates fields and IDs, deduplicates results, caps results at twelve,
and handles unavailable/malformed responses with a terse 503. Search requests are
submitted explicitly and bounded to 2–120 characters. CDN caching is short.

An independent official YouTube Data API adapter remains a future option. It
would need a server-only restricted credential, quota handling, and embedding
filters. That adapter is not implemented.

The final user decision was weather changes **during playback**. No title-based
weather forecast is implemented. Sun, Storm, and Snow use independent local audio
analysis through explicit tab sharing. Metadata never claims to be audio evidence.

Sources:
- [YouTube search.list](https://developers.google.com/youtube/v3/docs/search/list)
- [YouTube videos.list](https://developers.google.com/youtube/v3/docs/videos/list)
- [Screen capture](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture)
- [Soundspace repository](https://github.com/haidmoham/soundspace), README only.
