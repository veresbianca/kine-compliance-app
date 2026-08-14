/**
 * Seed script for local development and dashboard testing.
 *
 * Prerequisites:
 * 1. Copy .env.local.example → .env.local and fill in Supabase keys
 * 2. Run supabase/migrations/001_initial_schema.sql in your Supabase project
 * 3. Create a therapist account via Supabase Auth (or use SEED_THERAPIST_* below)
 *
 * Usage:
 *   npm run seed
 */

import "dotenv/config";

import { createAdminClient } from "../lib/supabase/admin";

const SAMPLE_EXERCISES = [
  {
    title: "McKenzie Extension",
    description:
      "Lie on your stomach and press up through your arms, keeping hips on the floor. Hold briefly, then lower.",
    video_url: "https://www.youtube.com/watch?v=3FRI_sOueQM",
    default_sets: 3,
    default_reps: 10,
  },
  {
    title: "Wall Slide",
    description:
      "Stand with back against a wall. Slide arms up and down in a 'W' to 'Y' motion while maintaining contact.",
    video_url: "https://www.youtube.com/watch?v=5Y2YgJPl0dM",
    default_sets: 3,
    default_reps: 12,
  },
  {
    title: "Knee Extension",
    description:
      "Sit upright and slowly straighten the affected knee, hold for 2 seconds, then lower with control.",
    video_url: "https://www.youtube.com/watch?v=YyvSfVjQeL0",
    default_sets: 3,
    default_reps: 15,
  },
] as const;

async function seedExercises() {
  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("exercise_library")
    .select("title");

  if (existingError) {
    throw existingError;
  }

  const existingTitles = new Set(existing?.map((row) => row.title) ?? []);
  const toInsert = SAMPLE_EXERCISES.filter(
    (exercise) => !existingTitles.has(exercise.title),
  );

  if (toInsert.length === 0) {
    console.log("Exercise library already seeded.");
    return;
  }

  const { error } = await supabase.from("exercise_library").insert([...toInsert]);

  if (error) {
    throw error;
  }

  console.log(`Seeded ${toInsert.length} sample exercise(s).`);
}

async function seedDemoPatient() {
  const therapistEmail = process.env.SEED_THERAPIST_EMAIL;
  const therapistPassword = process.env.SEED_THERAPIST_PASSWORD;

  if (!therapistEmail || !therapistPassword) {
    console.log(
      "Skipping demo patient seed — set SEED_THERAPIST_EMAIL and SEED_THERAPIST_PASSWORD to create one.",
    );
    return;
  }

  const supabase = createAdminClient();

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: therapistEmail,
      password: therapistPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Dr. Demo Therapist",
        clinic_name: "Kine Compliance Clinic",
      },
    });

  if (authError && !authError.message.includes("already been registered")) {
    throw authError;
  }

  const therapistId = authData.user?.id;

  if (!therapistId) {
    const { data: listData, error: listError } =
      await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existing = listData.users.find((user) => user.email === therapistEmail);
    if (!existing) {
      throw new Error("Could not resolve therapist user for demo seed.");
    }

    await seedPatientForTherapist(existing.id);
    return;
  }

  await seedPatientForTherapist(therapistId);
}

async function seedPatientForTherapist(therapistId: string) {
  const supabase = createAdminClient();

  const { data: existingPatients } = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("therapist_id", therapistId)
    .eq("full_name", "Alex Demo Patient");

  if (existingPatients && existingPatients.length > 0) {
    console.log("Demo patient already exists.");
    return;
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from("exercise_library")
    .select("id")
    .limit(3);

  if (exercisesError || !exercises?.length) {
    throw exercisesError ?? new Error("No exercises found to assign.");
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      therapist_id: therapistId,
      full_name: "Alex Demo Patient",
      phone_number: "+15555550123",
    })
    .select("id")
    .single();

  if (patientError) throw patientError;

  const { data: prescription, error: prescriptionError } = await supabase
    .from("prescriptions")
    .insert({
      patient_id: patient.id,
      therapist_id: therapistId,
      active: true,
    })
    .select("id, magic_token")
    .single();

  if (prescriptionError) throw prescriptionError;

  const { error: itemsError } = await supabase.from("prescription_items").insert(
    exercises.map((exercise, index) => ({
      prescription_id: prescription.id,
      exercise_id: exercise.id,
      sets: 3,
      reps: 10 + index * 2,
      frequency_per_day: 1,
    })),
  );

  if (itemsError) throw itemsError;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.log("Demo patient created.");
  console.log(`Patient magic link: ${appUrl}/p/${prescription.magic_token}`);
  console.log(`Therapist login: ${process.env.SEED_THERAPIST_EMAIL}`);
}

async function main() {
  console.log("Starting seed...");
  await seedExercises();
  await seedDemoPatient();
  console.log("Seed complete.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
