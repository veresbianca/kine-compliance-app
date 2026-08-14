import "server-only";

import { headers } from "next/headers";

/**
 * Resolves the current app origin from the incoming request.
 * Works for any local port (e.g. :3001) and production hosts on Vercel.
 */
export async function getRequestOrigin(): Promise<string> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host");

  if (!host) {
    return (
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000"
    );
  }

  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${protocol}://${host}`;
}
