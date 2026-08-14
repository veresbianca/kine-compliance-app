"use server";

import { revalidatePath } from "next/cache";

import { logCompletionByToken } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function submitPatientCompletion(input: {
  token: string;
  painScore: number;
  patientNotes?: string;
}) {
  const supabase = await createClient();

  const result = await logCompletionByToken(
    supabase,
    input.token,
    input.painScore,
    input.patientNotes,
  );

  if (result.error) {
    return { success: false as const, error: result.error };
  }

  revalidatePath(`/p/${input.token}`);
  revalidatePath("/dashboard");

  return {
    success: true as const,
    streakDays: result.data?.streak_days ?? 0,
  };
}
