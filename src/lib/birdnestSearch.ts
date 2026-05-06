import { MUNS_TOKEN } from "../utils/muns";

// In dev, requests go through Vite's proxy under /muns to avoid CORS.
// In prod, they hit Birdnest directly.
const BIRDNEST_BASE_URL = import.meta.env.DEV
  ? "/muns"
  : "https://birdnest.muns.io";

export type BirdnestEntry = {
  ticker: string;
  name: string;
  industry: string;
  country: string;
};

type BirdnestResponse = {
  data?: {
    results?: Record<string, [string, string, string] | undefined>;
  };
};

export function mapBirdnestEntry(
  ticker: string,
  tuple: [string, string, string],
): BirdnestEntry {
  const [country, name, industry] = tuple;
  return { ticker, name, industry, country };
}

function rankScore(entry: BirdnestEntry, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const ticker = entry.ticker.toLowerCase();
  const name = entry.name.toLowerCase();
  if (ticker === q) return 0;
  if (ticker.startsWith(q)) return 1;
  if (name.toLowerCase().startsWith(q)) return 2;
  if (ticker.includes(q)) return 3;
  if (name.includes(q)) return 4;
  return 5;
}

export async function searchBirdnest(
  query: string,
  signal?: AbortSignal,
): Promise<BirdnestEntry[]> {
  const q = query.trim();
  if (!q) return [];

  const res = await fetch(`${BIRDNEST_BASE_URL}/stock/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MUNS_TOKEN}`,
    },
    body: JSON.stringify({ query: q }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Birdnest search failed (${res.status})`);
  }

  const json = (await res.json()) as BirdnestResponse;
  const raw = json.data?.results ?? {};

  const entries: BirdnestEntry[] = [];
  for (const [ticker, tuple] of Object.entries(raw)) {
    if (!Array.isArray(tuple) || tuple.length < 3) continue;
    entries.push(mapBirdnestEntry(ticker, tuple));
  }

  entries.sort((a, b) => {
    const sa = rankScore(a, q);
    const sb = rankScore(b, q);
    if (sa !== sb) return sa - sb;
    return a.ticker.localeCompare(b.ticker);
  });

  return entries;
}
