export const DEFAULT_QRCODING_BASE_URL =
  "https://qrcoding-contentscoin-jakes-projects-0ab50f91.vercel.app";

export function getQrcodingBaseUrl(): string {
  return (process.env.QRCODING_BASE_URL ?? DEFAULT_QRCODING_BASE_URL).replace(/\/$/, "");
}
