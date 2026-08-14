import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ComplianceStatus,
  Database,
  LogCompletionResult,
  PatientPrescriptionView,
  Profile,
} from "@/types/database";

type AppSupabaseClient = SupabaseClient<Database>;

export async function getCurrentProfile(
  supabase: AppSupabaseClient,
): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data;
}

export async function getPrescriptionByToken(
  supabase: AppSupabaseClient,
  token: string,
): Promise<PatientPrescriptionView | null> {
  const { data, error } = await supabase.rpc("get_prescription_by_token", {
    p_token: token,
  });

  if (error || !data) return null;
  return data as PatientPrescriptionView;
}

export async function logCompletionByToken(
  supabase: AppSupabaseClient,
  token: string,
  painScore: number,
  patientNotes?: string,
): Promise<{ data: LogCompletionResult | null; error: string | null }> {
  const { data, error } = await supabase.rpc("log_completion_by_token", {
    p_token: token,
    p_pain_score: painScore,
    p_patient_notes: patientNotes ?? null,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as LogCompletionResult, error: null };
}

export function getComplianceStatus(input: {
  lastCompletedAt: string | null;
  latestPainScore: number | null;
}): ComplianceStatus {
  const { lastCompletedAt, latestPainScore } = input;

  if (latestPainScore !== null && latestPainScore >= 7) {
    return "red";
  }

  if (!lastCompletedAt) {
    return "red";
  }

  const lastDate = new Date(lastCompletedAt);
  const today = startOfUtcDay(new Date());
  const lastDay = startOfUtcDay(lastDate);
  const daysMissed = Math.floor(
    (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysMissed === 0) return "green";
  if (daysMissed <= 2) return "yellow";
  return "red";
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function buildPatientMagicLink(token: string, origin?: string) {
  const base =
    origin ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/p/${token}`;
}

export function extractYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;

      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch?.[1]) {
        return `https://www.youtube.com/embed/${embedMatch[1]}`;
      }
    }

    if (host === "player.vimeo.com") {
      return url;
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    return url;
  } catch {
    return null;
  }
}
