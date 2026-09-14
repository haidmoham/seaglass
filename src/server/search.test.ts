import assert from "node:assert/strict";
import test from "node:test";
import { searchResponse } from "./search";

test("search validates provider records and deduplicates video IDs", async (context) => {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({
      tracks: [
        {
          youtubeVideoId: "s77kCPJC42Y",
          title: "Sea Glass",
          artists: ["Driveways"],
        },
        { youtubeVideoId: "s77kCPJC42Y", title: "Duplicate", artists: [] },
        { youtubeVideoId: "bad", title: "Invalid", artists: [] },
      ],
    }),
  );
  const response = await searchResponse(
    new Request("https://example.test/api/search?q=sea+glass"),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    tracks: [
      {
        videoId: "s77kCPJC42Y",
        title: "Sea Glass",
        artist: "Driveways",
        duration: 0,
      },
    ],
  });
});

test("search rejects short input and reports upstream failure", async (context) => {
  const short = await searchResponse(
    new Request("https://example.test/api/search?q=a"),
  );
  assert.equal(short.status, 400);
  context.mock.method(
    globalThis,
    "fetch",
    async () => new Response("unavailable", { status: 503 }),
  );
  assert.equal(
    (
      await searchResponse(
        new Request("https://example.test/api/search?q=sea+glass"),
      )
    ).status,
    503,
  );
});
