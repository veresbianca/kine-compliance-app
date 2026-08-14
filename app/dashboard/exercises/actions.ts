"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export type ExerciseActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createExercise(input: {
  title: string;
  description: string;
  videoUrl: string;
  defaultSets: number;
  defaultReps: number;
}): Promise<ExerciseActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }

  const title = input.title.trim();
  const description = input.description.trim();
  const videoUrl = input.videoUrl.trim();

  if (!title) {
    return { success: false, error: "Title is required." };
  }

  if (!videoUrl) {
    return { success: false, error: "Video URL is required." };
  }

  const { error } = await supabase.from("exercise_library").insert({
    title,
    description,
    video_url: videoUrl,
    default_sets: input.defaultSets,
    default_reps: input.defaultReps,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/exercises");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteExercise(
  exerciseId: string,
): Promise<ExerciseActionResult> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return { success: false, error: "You must be logged in." };
  }

  const { error } = await supabase
    .from("exercise_library")
    .delete()
    .eq("id", exerciseId);

  if (error) {
    return {
      success: false,
      error:
        error.code === "23503"
          ? "This exercise is assigned to a prescription and cannot be deleted."
          : error.message,
    };
  }

  revalidatePath("/dashboard/exercises");
  revalidatePath("/dashboard");

  return { success: true };
}
