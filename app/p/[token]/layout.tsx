import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your exercises | Kine Compliance",
  description: "Daily home exercise program",
};

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-muted/20 text-base">{children}</div>
  );
}
