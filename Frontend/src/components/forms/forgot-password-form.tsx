"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useForm } from "@/hooks/use-form";
import { validateForgotPassword } from "@/lib/validation";
import { authService } from "@/services/auth.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import type { ApiError } from "@/services/api";
import type { ForgotPasswordRequestDto } from "@/types/auth";
import { IconInfo } from "@/components/common/icons";

type ToastedApiError = ApiError & { _toasted?: boolean };

export function ForgotPasswordForm() {
  const { addToast } = useToast();

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useForm<ForgotPasswordRequestDto>({
    initialValues: {
      email: "",
    },
    validate: validateForgotPassword,
    onSubmit: async (formValues) => {
      try {
        const email = formValues.email.trim();
        const response = await authService.forgotPassword({ email });

        const successMessage =
          response.message || "If the email exists, password reset instructions have been sent.";

        addToast({
          type: "success",
          message: successMessage,
        });

        setTimeout(() => {
          const expiresAt = Date.now() + 10 * 60 * 1000;
          window.location.href = `${ROUTES.VERIFY_OTP}?email=${encodeURIComponent(email)}&expiresAt=${expiresAt}`;
        }, 1000);
      } catch (error: unknown) {
        const apiError = error as ToastedApiError;
        addToast({
          type: "error",
          message: apiError.message || "Unable to send request. Please try again.",
          statusCode: apiError.statusCode,
        });
        apiError._toasted = true;
        throw apiError;
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      <Input
        label="Email address"
        id="email"
        name="email"
        type="email"
        placeholder="name@company.com"
        value={values.email}
        onChange={handleChange}
        error={errors.email}
        required
        className="h-11 border-[#E0D8CC] bg-white text-base focus:border-[#B8A88C] focus:ring-[#B8A88C]/30"
        leftIcon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
      />

      <div className="flex items-start gap-2 text-sm leading-6 text-stone-500">
        <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-[#B8A88C]" />
        <p>The verification code will be sent within 2 minutes.</p>
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        className="h-12 w-full gap-2 rounded-xl bg-stone-700 text-base font-bold uppercase tracking-wide text-[#F5F0E8] hover:bg-stone-800"
        rightIcon={<ArrowRight className="h-5 w-5" />}
      >
        Send request
      </Button>

      <div className="pt-1 text-center text-sm text-stone-500">
        <Link
          href={ROUTES.LOGIN}
          className="font-bold text-stone-700 transition-colors hover:text-stone-900"
        >
          ← Back to sign in
        </Link>
      </div>
    </form>
  );
}
