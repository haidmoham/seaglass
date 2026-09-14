import type { Track } from "../music/track";
import { z } from "zod";

const providerTrack = z.object({
  youtubeVideoId: z.string().regex(/^[\w-]{11}$/),
  title: z.string(),
  artists: z.array(z.string()).default([]),
});
const providerResponse = z.object({ tracks: z.array(z.unknown()) });

export async function searchResponse(request: Request): Promise<Response> {
  if (request.method !== "GET")
    return Response.json({ error: "GET only" }, { status: 405 });
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 120) {
    return Response.json({ error: "Use 2–120 characters." }, { status: 400 });
  }
  const url = new URL(
    "https://soundspace-api-production-274d.up.railway.app/api/youtube/search",
  );
  url.searchParams.set("q", query);
  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok)
      return Response.json({ error: "Search unavailable." }, { status: 503 });
    const data = providerResponse.parse(await upstream.json());
    const tracks: Track[] = [];
    const seen = new Set<string>();
    for (const candidate of data.tracks.slice(0, 12)) {
      const parsed = providerTrack.safeParse(candidate);
      if (!parsed.success) continue;
      const item = parsed.data;
      if (seen.has(item.youtubeVideoId)) continue;
      seen.add(item.youtubeVideoId);
      tracks.push({
        videoId: item.youtubeVideoId,
        title: item.title.slice(0, 200),
        artist: item.artists.join(", ").slice(0, 160) || "YouTube",
        duration: 0,
      });
    }
    return Response.json(
      { tracks },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch {
    return Response.json({ error: "Search didn’t connect." }, { status: 503 });
  }
}
