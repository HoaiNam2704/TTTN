import { Metadata } from "next";
import { RegisterForm } from "@/components/forms/register-form";
import { Logo } from "@/components/common/logo";
import { AuthPageShell } from "@/components/layout/auth-page-shell";

export const metadata: Metadata = {
  title: "Sign up | ITIS Academy",
  description:
    "Create your learning account at ITIS Academy.",
};

export default function RegisterPage() {
  return (
    <AuthPageShell wide>
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="hidden lg:col-span-5 lg:flex flex-col justify-between bg-stone-700 p-10 xl:p-12 text-[#F5F0E8]">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight leading-tight">
              Elevate your knowledge
              <br />
              with ITIS Academy
            </h2>
            <p className="text-base text-[#D4C4A8]/90 leading-relaxed">
              A modern learning management system built for businesses and
              professional education organizations.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#D4C4A8]/25 bg-[#D4C4A8]/10 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#D4C4A8]/20 text-[#E0D2BA]">
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-medium text-[#F5F0E8]">
                International-standard certificates
              </h4>
              <p className="mt-1 text-sm text-[#D4C4A8]/80">
                Complete courses and earn your certificate right away.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-center px-8 py-10 sm:px-10 sm:py-12">
          <div className="mx-auto w-full max-w-md space-y-5">
            <Logo size="lg" className="text-stone-700 [&_svg]:text-[#B8A88C]" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-800">
                Create an account
              </h1>
            </div>
            <RegisterForm />
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
}
