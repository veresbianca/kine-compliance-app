"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildPatientMagicLink } from "@/lib/app-origin";
import { getRequestOrigin } from "@/lib/app-origin.server";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export type SelectedExerciseInput = {
  exerciseId: string;
  sets: number;
  reps: number;
  frequencyPerDay: number;
};

export type CreatePatientResult =
  | { success: true; magicLink: string }
  | { success: false; error: string };

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createPatientWithPrescription(input: {
  fullName: string;
  phoneNumber: string;
  exercises: SelectedExerciseInput[];
}): Promise<CreatePatientResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }

  const fullName = input.fullName.trim();
  const phoneNumber = input.phoneNumber.trim();

  if (!fullName) {
    return { success: false, error: "Patient name is required." };
  }

  if (!phoneNumber) {
    return { success: false, error: "Phone number is required." };
  }

  if (input.exercises.length < 2 || input.exercises.length > 4) {
    return {
      success: false,
      error: "Select between 2 and 4 exercises.",
    };
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      therapist_id: profile.id,
      full_name: fullName,
      phone_number: phoneNumber,
    })
    .select("id")
    .single();

  if (patientError || !patient) {
    return {
      success: false,
      error: patientError?.message ?? "Failed to create patient.",
    };
  }

  const { data: prescription, error: prescriptionError } = await supabase
    .from("prescriptions")
    .insert({
      patient_id: patient.id,
      therapist_id: profile.id,
      active: true,
    })
    .select("id, magic_token")
    .single();

  if (prescriptionError || !prescription) {
    return {
      success: false,
      error: prescriptionError?.message ?? "Failed to create prescription.",
    };
  }

  const { error: itemsError } = await supabase.from("prescription_items").insert(
    input.exercises.map((item) => ({
      prescription_id: prescription.id,
      exercise_id: item.exerciseId,
      sets: item.sets,
      reps: item.reps,
      frequency_per_day: item.frequencyPerDay,
    })),
  );

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  revalidatePath("/dashboard");

  const origin = await getRequestOrigin();

  return {
    success: true,
    magicLink: buildPatientMagicLink(prescription.magic_token, origin),
  };
}
