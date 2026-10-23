import type { Metadata } from "next";
import { Logo } from "@/components/common/logo";
import { AuthPageShell } from "@/components/layout/auth-page-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password | ITIS Academy",
  description:
    "Enter your email to receive password reset instructions on ITIS Academy.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <div className="px-8 py-10 sm:px-12 sm:py-12">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" className="text-stone-700 [&_svg]:text-[#B8A88C]" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800 sm:text-[1.75rem]">
            Forgot password
          </h1>
          <p className="mt-2 text-base text-stone-500">
            Enter the email address linked to your account to receive password
            reset instructions.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </AuthPageShell>
  );
}
