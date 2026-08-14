import { ExerciseLibraryManager } from "@/components/dashboard/exercise-library-manager";
import { getExerciseLibrary } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const exercises = await getExerciseLibrary(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Exercise library
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Manage demo videos and default sets/reps for home exercise programs.
        </p>
      </div>

      <ExerciseLibraryManager exercises={exercises} />
    </div>
  );
}
