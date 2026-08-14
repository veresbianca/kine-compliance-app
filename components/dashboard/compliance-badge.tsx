import type { ComplianceStatus } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  ComplianceStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  green: {
    label: "Logged today",
    dotClass: "bg-emerald-500",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
  yellow: {
    label: "Missed 1–2 days",
    dotClass: "bg-amber-400",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  red: {
    label: "Needs attention",
    dotClass: "bg-red-500",
    badgeClass:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  },
};

type ComplianceBadgeProps = {
  status: ComplianceStatus;
  label?: string;
  className?: string;
};

export function ComplianceBadge({
  status,
  label,
  className,
}: ComplianceBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-normal", config.badgeClass, className)}
    >
      <span
        className={cn("size-2 rounded-full", config.dotClass)}
        aria-hidden
      />
      {label ?? config.label}
    </Badge>
  );
}
