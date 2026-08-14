import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <AuthForm mode="signup" />
    </div>
  );
}
