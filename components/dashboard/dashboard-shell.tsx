import Link from "next/link";
import { Activity, Dumbbell, LogOut } from "lucide-react";

import { signOut } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  return (
    <div className="min-h-full bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="size-4" />
              </span>
              <div>
                <p className="text-base font-semibold leading-none">
                  Kine Compliance
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.clinic_name ?? "Therapist dashboard"}
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              <Button variant="secondary" size="sm" render={<Link href="/dashboard" />}>
                Patients
              </Button>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/dashboard/exercises" />}
              >
                <Dumbbell />
                Exercises
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-base font-medium leading-none">
                {profile?.full_name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile?.email}
              </p>
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
