import Link from "next/link";
import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <WifiOff className="size-8 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-base text-muted-foreground">
        Reconnect to load your latest exercises. Cached pages may still be
        available when you return online.
      </p>
      <Button className="mt-8" render={<Link href="/" />}>
        Try again
      </Button>
    </div>
  );
}
