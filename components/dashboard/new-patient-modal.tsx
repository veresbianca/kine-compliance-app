"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createPatientWithPrescription,
  type SelectedExerciseInput,
} from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExerciseLibrary } from "@/types/database";

type ExerciseDraft = SelectedExerciseInput & {
  title: string;
};

type NewPatientModalProps = {
  exercises: ExerciseLibrary[];
};

export function NewPatientModal({ exercises }: NewPatientModalProps) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selected, setSelected] = useState<Record<string, ExerciseDraft>>({});
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCount = Object.keys(selected).length;

  const sortedExercises = useMemo(
    () => [...exercises].sort((a, b) => a.title.localeCompare(b.title)),
    [exercises],
  );

  function resetForm() {
    setFullName("");
    setPhoneNumber("");
    setSelected({});
    setGeneratedLink(null);
  }

  function toggleExercise(exercise: ExerciseLibrary, checked: boolean) {
    setSelected((current) => {
      const next = { ...current };

      if (!checked) {
        delete next[exercise.id];
        return next;
      }

      if (Object.keys(next).length >= 4) {
        toast.error("You can assign up to 4 exercises.");
        return current;
      }

      next[exercise.id] = {
        exerciseId: exercise.id,
        title: exercise.title,
        sets: exercise.default_sets,
        reps: exercise.default_reps,
        frequencyPerDay: 1,
      };

      return next;
    });
  }

  function updateExerciseField(
    exerciseId: string,
    field: "sets" | "reps" | "frequencyPerDay",
    value: number,
  ) {
    setSelected((current) => ({
      ...current,
      [exerciseId]: {
        ...current[exerciseId],
        [field]: value,
      },
    }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createPatientWithPrescription({
        fullName,
        phoneNumber,
        exercises: Object.values(selected).map(
          ({ exerciseId, sets, reps, frequencyPerDay }) => ({
            exerciseId,
            sets,
            reps,
            frequencyPerDay,
          }),
        ),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setGeneratedLink(result.magicLink);
      toast.success("Prescription created");

      try {
        await navigator.clipboard.writeText(result.magicLink);
        toast.success("Patient link copied to clipboard");
      } catch {
        // Clipboard may be unavailable; link is still shown in the dialog.
      }
    });
  }

  async function copyGeneratedLink() {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Patient link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus />
        New patient
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New patient & prescription</DialogTitle>
          <DialogDescription>
            Add a patient, assign 2–4 daily exercises, and generate their magic
            link.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Patient link ready</p>
              <p className="mt-2 break-all text-sm text-muted-foreground">
                {generatedLink}
              </p>
            </div>
            <DialogFooter className="border-t-0 bg-transparent p-0 sm:justify-start">
              <Button type="button" onClick={copyGeneratedLink}>
                <Copy />
                Copy patient link
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient name</Label>
                <Input
                  id="patientName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Alex Johnson"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientPhone">Phone number</Label>
                <Input
                  id="patientPhone"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+1 555 0100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Exercises ({selectedCount}/4)</Label>
                <span className="text-xs text-muted-foreground">
                  Select 2–4 exercises
                </span>
              </div>

              {sortedExercises.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No exercises in the library yet. Seed sample data or add
                  exercises first.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedExercises.map((exercise) => {
                    const draft = selected[exercise.id];
                    const checked = Boolean(draft);

                    return (
                      <div
                        key={exercise.id}
                        className="rounded-lg border p-3"
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleExercise(exercise, value === true)
                            }
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {exercise.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {exercise.description}
                            </p>
                          </div>
                        </label>

                        {checked && draft ? (
                          <div className="mt-3 grid grid-cols-3 gap-2 pl-7">
                            <div className="space-y-1">
                              <Label className="text-xs">Sets</Label>
                              <Input
                                type="number"
                                min={1}
                                value={draft.sets}
                                onChange={(event) =>
                                  updateExerciseField(
                                    exercise.id,
                                    "sets",
                                    Number(event.target.value),
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Reps</Label>
                              <Input
                                type="number"
                                min={1}
                                value={draft.reps}
                                onChange={(event) =>
                                  updateExerciseField(
                                    exercise.id,
                                    "reps",
                                    Number(event.target.value),
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Per day</Label>
                              <Input
                                type="number"
                                min={1}
                                value={draft.frequencyPerDay}
                                onChange={(event) =>
                                  updateExerciseField(
                                    exercise.id,
                                    "frequencyPerDay",
                                    Number(event.target.value),
                                  )
                                }
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending || selectedCount < 2 || selectedCount > 4}
                onClick={handleSubmit}
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Copy />
                    Generate & copy link
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
