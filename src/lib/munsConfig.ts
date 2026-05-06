// Hardcoded Birdnest (Muns) bearer token. Note: this ships to the browser
// bundle, so anyone who loads the site can read it.
export const MUNS_BEARER_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZWE5ZGMyYi0xZDBmLTQ2MzctOGE2Ny0wM2VhNzFmMGYyY2YiLCJlbWFpbCI6Im5hZGFtc2FsdWphQGdtYWlsLmNvbSIsIm9yZ0lkIjoiMSIsImF1dGhvcml0eSI6ImFkbWluIiwiaWF0IjoxNzc3OTgzNTUzLCJleHAiOjE3Nzg0MTU1NTN9.IQKdGF0H3E_KzCy5h5dyTAIFgSMkbHQ5PEtNjtEVY_c";

// In dev, requests go through Vite's proxy under /muns to avoid CORS.
// In prod, they hit Birdnest directly.
export const BIRDNEST_BASE_URL = import.meta.env.DEV
  ? "/muns"
  : "https://birdnest.muns.io";
