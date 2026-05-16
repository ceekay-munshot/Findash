interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  MUNS_ACCESS_TOKEN: string;
}

const MUNS_CHAT_UPSTREAM = "https://devde.muns.io/chat/chat-muns";
const BIRDNEST_UPSTREAM = "https://birdnest.muns.io";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/muns/chat") {
      return proxy(request, env, MUNS_CHAT_UPSTREAM);
    }

    if (url.pathname.startsWith("/api/muns/birdnest/")) {
      const target = BIRDNEST_UPSTREAM + url.pathname.slice("/api/muns/birdnest".length) + url.search;
      return proxy(request, env, target);
    }

    return env.ASSETS.fetch(request);
  },
};

async function proxy(request: Request, env: Env, target: string): Promise<Response> {
  if (!env.MUNS_ACCESS_TOKEN) {
    return new Response("MUNS_ACCESS_TOKEN is not configured", { status: 500 });
  }

  const upstream = await fetch(target, {
    method: request.method,
    headers: {
      accept: request.headers.get("accept") ?? "*/*",
      "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      Authorization: `Bearer ${env.MUNS_ACCESS_TOKEN}`,
    },
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/plain; charset=utf-8",
    },
  });
}
