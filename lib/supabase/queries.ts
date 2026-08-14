import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ComplianceStatus,
  Database,
  LogCompletionResult,
  PatientPrescriptionView,
  PatientWithPrescription,
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

  if (!lastCompletedAt) {
    return "red";
  }

  const daysMissed = getDaysSinceLastCompletion(lastCompletedAt);

  if (daysMissed === 0) {
    if (latestPainScore !== null && latestPainScore >= 7) {
      return "red";
    }
    return "green";
  }

  if (latestPainScore !== null && latestPainScore >= 7) {
    return "red";
  }

  if (daysMissed <= 2) {
    return "yellow";
  }

  return "red";
}

export function getComplianceLabel(input: {
  status: ComplianceStatus;
  lastCompletedAt: string | null;
  latestPainScore: number | null;
}): string {
  const { status, lastCompletedAt, latestPainScore } = input;

  if (
    status === "red" &&
    lastCompletedAt &&
    getDaysSinceLastCompletion(lastCompletedAt) === 0 &&
    latestPainScore !== null &&
    latestPainScore >= 7
  ) {
    return "High pain today";
  }

  if (status === "green") return "Logged today";
  if (status === "yellow") return "Missed 1–2 days";
  return "Needs attention";
}

function getDaysSinceLastCompletion(lastCompletedAt: string) {
  const today = startOfLocalDay(new Date());
  const lastDay = startOfLocalDay(new Date(lastCompletedAt));

  return Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function getExerciseLibrary(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("exercise_library")
    .select("*")
    .order("title");

  if (error) throw error;
  return data ?? [];
}

export async function getDashboardPatients(
  supabase: AppSupabaseClient,
  therapistId: string,
): Promise<PatientWithPrescription[]> {
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select(
      `
      id,
      therapist_id,
      full_name,
      phone_number,
      created_at,
      prescriptions (
        id,
        patient_id,
        therapist_id,
        magic_token,
        active,
        created_at,
        completion_logs (
          completed_at,
          pain_score
        )
      )
    `,
    )
    .eq("therapist_id", therapistId)
    .order("created_at", { ascending: false });

  if (patientsError) throw patientsError;
  if (!patients?.length) return [];

  const activePrescriptionIds = patients
    .map((patient) => patient.prescriptions?.find((rx) => rx.active)?.id)
    .filter((id): id is string => Boolean(id));

  const fallbackLogs = await fetchLatestLogsByPrescriptionIds(
    supabase,
    activePrescriptionIds,
  );

  return patients.map((patient) => {
    const prescription =
      patient.prescriptions?.find((rx) => rx.active) ?? null;

    const nestedLatestLog = prescription?.completion_logs?.reduce<
      { completed_at: string; pain_score: number } | null
    >((latest, log) => {
      if (!latest) return log;
      return new Date(log.completed_at) > new Date(latest.completed_at)
        ? log
        : latest;
    }, null) ?? null;

    const latestLog =
      nestedLatestLog ??
      (prescription ? (fallbackLogs.get(prescription.id) ?? null) : null);

    const complianceStatus = getComplianceStatus({
      lastCompletedAt: latestLog?.completed_at ?? null,
      latestPainScore: latestLog?.pain_score ?? null,
    });

    return {
      id: patient.id,
      therapist_id: patient.therapist_id,
      full_name: patient.full_name,
      phone_number: patient.phone_number,
      created_at: patient.created_at,
      prescription: prescription
        ? {
            id: prescription.id,
            patient_id: prescription.patient_id,
            therapist_id: prescription.therapist_id,
            magic_token: prescription.magic_token,
            active: prescription.active,
            created_at: prescription.created_at,
          }
        : null,
      compliance_status: complianceStatus,
      compliance_label: getComplianceLabel({
        status: complianceStatus,
        lastCompletedAt: latestLog?.completed_at ?? null,
        latestPainScore: latestLog?.pain_score ?? null,
      }),
      last_completed_at: latestLog?.completed_at ?? null,
      latest_pain_score: latestLog?.pain_score ?? null,
      streak_days: 0,
    };
  });
}

async function fetchLatestLogsByPrescriptionIds(
  supabase: AppSupabaseClient,
  prescriptionIds: string[],
) {
  const latestByPrescription = new Map<
    string,
    { completed_at: string; pain_score: number }
  >();

  if (prescriptionIds.length === 0) {
    return latestByPrescription;
  }

  const { data: logs, error } = await supabase
    .from("completion_logs")
    .select("prescription_id, completed_at, pain_score")
    .in("prescription_id", prescriptionIds)
    .order("completed_at", { ascending: false });

  if (error) {
    throw error;
  }

  for (const log of logs ?? []) {
    if (!latestByPrescription.has(log.prescription_id)) {
      latestByPrescription.set(log.prescription_id, {
        completed_at: log.completed_at,
        pain_score: log.pain_score,
      });
    }
  }

  return latestByPrescription;
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
