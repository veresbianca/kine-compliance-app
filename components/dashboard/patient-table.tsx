"use client";

import { Copy, Link2 } from "lucide-react";
import { toast } from "sonner";

import { ComplianceBadge } from "@/components/dashboard/compliance-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildPatientMagicLink } from "@/lib/app-origin";
import type { PatientWithPrescription } from "@/types/database";

type PatientTableProps = {
  patients: PatientWithPrescription[];
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function PatientTable({ patients }: PatientTableProps) {
  async function copyLink(token: string) {
    const link = buildPatientMagicLink(token, window.location.origin);

    try {
      await navigator.clipboard.writeText(link);
      toast.success("Patient link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }

  if (patients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
        <p className="text-base font-medium">No patients yet</p>
        <p className="mt-1 text-base text-muted-foreground">
          Create your first prescription to send a magic link to a patient.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last log</TableHead>
            <TableHead>Pain</TableHead>
            <TableHead className="text-right">Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">{patient.full_name}</TableCell>
              <TableCell className="text-muted-foreground">
                {patient.phone_number}
              </TableCell>
              <TableCell>
                <ComplianceBadge
                  status={patient.compliance_status}
                  label={patient.compliance_label}
                />
              </TableCell>
              <TableCell>{formatDate(patient.last_completed_at)}</TableCell>
              <TableCell>
                {patient.latest_pain_score ?? "—"}
                {patient.latest_pain_score !== null &&
                patient.latest_pain_score >= 7 ? (
                  <span className="ml-1 text-xs text-destructive">High</span>
                ) : null}
              </TableCell>
              <TableCell className="text-right">
                {patient.prescription ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyLink(patient.prescription!.magic_token)
                    }
                  >
                    <Copy />
                    Copy link
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Link2 className="size-3.5" />
                    No active Rx
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
