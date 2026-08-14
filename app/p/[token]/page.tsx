import { notFound } from "next/navigation";

import { PatientPortal } from "@/components/patient/patient-portal";
import { getPrescriptionByToken } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const data = await getPrescriptionByToken(supabase, token);

  if (!data) {
    notFound();
  }

  return <PatientPortal token={token} data={data} />;
}
