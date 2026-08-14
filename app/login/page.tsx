import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <AuthForm mode="login" redirectTo={params.redirectTo ?? "/dashboard"} />
    </div>
  );
}
