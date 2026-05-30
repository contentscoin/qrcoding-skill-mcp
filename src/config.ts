// Upstream QR Agent Studio (REPO A) production deployment. Override with the
// QRCODING_BASE_URL env var to point the gateway at a different deployment
// (e.g. a preview URL or a future custom domain).
export const DEFAULT_QRCODING_BASE_URL = "https://qrcoding-eight.vercel.app";

export function getQrcodingBaseUrl(): string {
  return (process.env.QRCODING_BASE_URL ?? DEFAULT_QRCODING_BASE_URL).replace(/\/$/, "");
}
