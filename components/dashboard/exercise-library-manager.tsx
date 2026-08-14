"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createExercise,
  deleteExercise,
} from "@/app/dashboard/exercises/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExerciseLibrary } from "@/types/database";

type ExerciseLibraryManagerProps = {
  exercises: ExerciseLibrary[];
};

export function ExerciseLibraryManager({
  exercises,
}: ExerciseLibraryManagerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [defaultSets, setDefaultSets] = useState(3);
  const [defaultReps, setDefaultReps] = useState(10);
  const [isPending, startTransition] = useTransition();

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createExercise({
        title,
        description,
        videoUrl,
        defaultSets,
        defaultReps,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setTitle("");
      setDescription("");
      setVideoUrl("");
      setDefaultSets(3);
      setDefaultReps(10);
      toast.success("Exercise added");
    });
  }

  function handleDelete(exerciseId: string, exerciseTitle: string) {
    if (
      !window.confirm(`Delete "${exerciseTitle}" from the library?`) ||
      isPending
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteExercise(exerciseId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Exercise deleted");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Add exercise</CardTitle>
          <CardDescription>
            Create a reusable exercise with a YouTube or Vimeo demo video.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exerciseTitle">Title</Label>
              <Input
                id="exerciseTitle"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="McKenzie Extension"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exerciseDescription">Description</Label>
              <Textarea
                id="exerciseDescription"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Brief instructions for the patient"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exerciseVideo">Video URL</Label>
              <Input
                id="exerciseVideo"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="defaultSets">Default sets</Label>
                <Input
                  id="defaultSets"
                  type="number"
                  min={1}
                  value={defaultSets}
                  onChange={(event) =>
                    setDefaultSets(Number(event.target.value))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultReps">Default reps</Label>
                <Input
                  id="defaultReps"
                  type="number"
                  min={1}
                  value={defaultReps}
                  onChange={(event) =>
                    setDefaultReps(Number(event.target.value))
                  }
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Saving..." : "Add exercise"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Library ({exercises.length})</h2>
          <p className="text-base text-muted-foreground">
            Exercises available when creating patient prescriptions.
          </p>
        </div>

        {exercises.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <p className="font-medium">No exercises yet</p>
            <p className="mt-1 text-base text-muted-foreground">
              Add your first exercise or run <code>npm run seed</code>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise) => (
              <Card key={exercise.id}>
                <CardContent className="flex items-start justify-between gap-4 pt-6">
                  <div className="min-w-0 space-y-1">
                    <p className="text-lg font-medium">{exercise.title}</p>
                    <p className="text-base text-muted-foreground">
                      {exercise.description || "No description provided."}
                    </p>
                    <p className="text-base text-muted-foreground">
                      Default: {exercise.default_sets} sets ×{" "}
                      {exercise.default_reps} reps
                    </p>
                    <a
                      href={exercise.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-base text-primary underline-offset-4 hover:underline"
                    >
                      View video
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(exercise.id, exercise.title)}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
