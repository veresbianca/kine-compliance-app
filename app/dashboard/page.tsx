import { NewPatientModal } from "@/components/dashboard/new-patient-modal";
import { PatientTable } from "@/components/dashboard/patient-table";
import {
  getCurrentProfile,
  getDashboardPatients,
  getExerciseLibrary,
} from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return null;
  }

  const [patients, exercises] = await Promise.all([
    getDashboardPatients(supabase, profile.id),
    getExerciseLibrary(supabase),
  ]);

  const needsAttention = patients.filter(
    (patient) => patient.compliance_status === "red",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Track home exercise compliance and share magic links instantly.
          </p>
        </div>
        <NewPatientModal exercises={exercises} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active patients" value={String(patients.length)} />
        <StatCard
          label="Logged today"
          value={String(
            patients.filter((patient) => patient.compliance_status === "green")
              .length,
          )}
        />
        <StatCard label="Needs attention" value={String(needsAttention)} />
      </div>

      <PatientTable patients={patients} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-base text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
