"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { submitPatientCompletion } from "@/app/p/[token]/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractYouTubeEmbedUrl } from "@/lib/supabase/queries";
import type { PatientPrescriptionView } from "@/types/database";

type PatientPortalProps = {
  token: string;
  data: PatientPrescriptionView;
};

export function PatientPortal({ token, data: initialData }: PatientPortalProps) {
  const [data, setData] = useState(initialData);
  const [painScore, setPainScore] = useState(3);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitPatientCompletion({
        token,
        painScore,
        patientNotes: notes,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setData((current) => ({
        ...current,
        logged_today: true,
        streak_days: result.streakDays,
      }));
      toast.success(`Great job! Streak: ${result.streakDays} day(s)`);
    });
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col pb-44">
      <header className="border-b bg-background px-4 py-5">
        <p className="text-base font-medium text-primary">
          {data.therapist.clinic_name ?? "Your clinic"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Hi, {data.patient.full_name}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Complete today&apos;s home exercises below.
        </p>
      </header>

      <div className="space-y-4 px-4 py-5">
        {data.items.map((item) => {
          const embedUrl = extractYouTubeEmbedUrl(item.exercise.video_url);

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
            >
              <div className="aspect-video bg-muted">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={item.exercise.title}
                    className="size-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex size-full items-center justify-center px-4 text-center text-base text-muted-foreground">
                    Video unavailable
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <h2 className="text-xl font-semibold">{item.exercise.title}</h2>
                <p className="text-base text-muted-foreground">
                  {item.exercise.description}
                </p>
                <p className="text-base font-medium">
                  {item.sets} sets × {item.reps} reps · {item.frequency_per_day}
                  x/day
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-lg space-y-4">
          {data.logged_today ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
              <CheckCircle2 className="size-6 shrink-0" />
              <div>
                <p className="text-lg font-semibold">Completed for today</p>
                <p className="text-base">
                  Great job! Streak: {data.streak_days} day(s)
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium">Pain score today</p>
                  <span className="text-2xl font-semibold">{painScore}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={painScore}
                  onChange={(event) => setPainScore(Number(event.target.value))}
                  className="h-3 w-full cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1 — Low</span>
                  <span>10 — High</span>
                </div>
              </div>

              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional feedback for your therapist"
                rows={2}
                className="text-base"
              />

              <Button
                type="button"
                size="lg"
                className="h-12 w-full text-base"
                disabled={isPending}
                onClick={handleSubmit}
              >
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Mark completed today"
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
