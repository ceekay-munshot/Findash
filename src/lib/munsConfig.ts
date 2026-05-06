// Hardcoded Birdnest (Muns) credentials. Replace the token below with the
// value provided to you. Note: this ships to the browser bundle, so treat the
// token accordingly.
export const MUNS_BEARER_TOKEN = "REPLACE_WITH_BIRDNEST_TOKEN";

// In dev, requests go through Vite's proxy under /muns to avoid CORS.
// In prod, they hit Birdnest directly.
export const BIRDNEST_BASE_URL = import.meta.env.DEV
  ? "/muns"
  : "https://birdnest.muns.io";
