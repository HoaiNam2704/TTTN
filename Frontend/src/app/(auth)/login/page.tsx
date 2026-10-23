import { Metadata } from "next";
import { LoginForm } from "@/components/forms/login-form";
import { Logo } from "@/components/common/logo";
import { AuthPageShell } from "@/components/layout/auth-page-shell";

export const metadata: Metadata = {
  title: "Sign in | ITIS Academy",
  description:
    "Sign in to the ITIS Academy learning management system. Welcome back to your learning journey.",
};

export default function LoginPage() {
  return (
    <AuthPageShell>
      <div className="px-8 py-10 sm:px-12 sm:py-12">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" className="text-stone-700 [&_svg]:text-[#B8A88C]" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800 sm:text-[1.75rem]">
            Sign in to your account
          </h1>
          <p className="mt-2 text-base text-stone-500">
            Welcome back to your learning journey.
          </p>
        </div>

        <LoginForm />
      </div>
    </AuthPageShell>
  );
}
