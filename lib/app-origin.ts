export function buildPatientMagicLink(token: string, origin?: string) {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : undefined) ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  return `${base.replace(/\/$/, "")}/p/${token}`;
}
