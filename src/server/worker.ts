import { searchResponse } from "./search";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === "/api/search")
      return searchResponse(request);
    return env.ASSETS.fetch(request);
  },
};
