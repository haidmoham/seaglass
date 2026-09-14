import type { IncomingMessage, ServerResponse } from "node:http";
import { searchResponse } from "../src/server/search.js";

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  const result = await searchResponse(
    new Request(
      new URL(
        request.url ?? "/api/search",
        "https://seaglass-exhibit.vercel.app",
      ),
      { method: request.method },
    ),
  );
  response.statusCode = result.status;
  result.headers.forEach((value, key) => response.setHeader(key, value));
  response.end(await result.text());
}
