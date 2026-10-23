import type { Metadata } from "next";
import { Logo } from "@/components/common/logo";
import { AuthPageShell } from "@/components/layout/auth-page-shell";
import { VerifyOtpForm } from "@/components/forms/verify-otp-form";

export const metadata: Metadata = {
  title: "Verify OTP | ITIS Academy",
  description: "Enter the 6-digit OTP to continue resetting your password.",
};

type VerifyOtpPageProps = {
  searchParams?: Promise<{
    email?: string;
    expiresAt?: string;
  }>;
};

export default async function VerifyOtpPage({
  searchParams,
}: VerifyOtpPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const email =
    typeof resolvedSearchParams.email === "string"
      ? resolvedSearchParams.email
      : "";
  const expiresAtValue =
    typeof resolvedSearchParams.expiresAt === "string"
      ? Number(resolvedSearchParams.expiresAt)
      : undefined;
  const expiresAt = Number.isFinite(expiresAtValue) ? expiresAtValue : undefined;

  return (
    <AuthPageShell>
      <div className="px-8 py-10 sm:px-12 sm:py-12">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" className="text-stone-700 [&_svg]:text-[#B8A88C]" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800 sm:text-[1.75rem]">
            Verify OTP
          </h1>
          <p className="mt-2 text-base text-stone-500">
            We sent a 6-digit OTP to your email. Please enter the code to
            continue resetting your password.
          </p>
        </div>

        <VerifyOtpForm email={email} expiresAt={expiresAt} />
      </div>
    </AuthPageShell>
  );
}
