import type { Metadata } from "next";
import { Logo } from "@/components/common/logo";
import { AuthPageShell } from "@/components/layout/auth-page-shell";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password | ITIS Academy",
  description: "Enter a new password to reset your ITIS Academy account.",
};

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    email?: string;
    otp?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const email =
    typeof resolvedSearchParams.email === "string"
      ? resolvedSearchParams.email
      : "";
  const otp =
    typeof resolvedSearchParams.otp === "string"
      ? resolvedSearchParams.otp
      : "";

  return (
    <AuthPageShell>
      <div className="px-8 py-10 sm:px-12 sm:py-12">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" className="text-stone-700 [&_svg]:text-[#B8A88C]" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800 sm:text-[1.75rem]">
            Reset password
          </h1>
          <p className="mt-2 text-base text-stone-500">
            Please enter your new password below.
          </p>
        </div>

        <ResetPasswordForm email={email} otp={otp} />
      </div>
    </AuthPageShell>
  );
}
