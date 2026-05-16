// Cloudflare Pages Function: proxies chat requests to MUNS and injects the
// access token from the MUNS_ACCESS_TOKEN secret so it never reaches the browser.

interface Env {
  MUNS_ACCESS_TOKEN: string;
}

const MUNS_CHAT_URL = "https://devde.muns.io/chat/chat-muns";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = env.MUNS_ACCESS_TOKEN;
  if (!token) {
    return new Response("MUNS_ACCESS_TOKEN is not configured", { status: 500 });
  }

  const body = await request.text();

  const upstream = await fetch(MUNS_CHAT_URL, {
    method: "POST",
    headers: {
      accept: "*/*",
      Authorization: `Bearer ${token}`,
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
};
