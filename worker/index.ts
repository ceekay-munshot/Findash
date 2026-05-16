interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  MUNS_ACCESS_TOKEN: string;
}

const MUNS_CHAT_URL = "https://devde.muns.io/chat/chat-muns";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/muns/chat" && request.method === "POST") {
      return handleMunsChat(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleMunsChat(request: Request, env: Env): Promise<Response> {
  if (!env.MUNS_ACCESS_TOKEN) {
    return new Response("MUNS_ACCESS_TOKEN is not configured", { status: 500 });
  }

  const body = await request.text();

  const upstream = await fetch(MUNS_CHAT_URL, {
    method: "POST",
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${env.MUNS_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/plain; charset=utf-8",
    },
  });
}
