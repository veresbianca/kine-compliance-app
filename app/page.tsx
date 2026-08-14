import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  redirect(profile ? "/dashboard" : "/login");
}
