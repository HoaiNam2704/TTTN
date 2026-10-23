"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "@/hooks/use-form";
import { validateResetPassword, type ResetPasswordFormValues } from "@/lib/validation";
import { authService } from "@/services/auth.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import type { ApiError } from "@/services/api";
import type { ResetPasswordRequestDto } from "@/types/auth";

type ToastedApiError = ApiError & { _toasted?: boolean };

interface ResetPasswordFormProps {
  email: string;
  otp: string;
}

export function ResetPasswordForm({ email, otp }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { addToast } = useToast();

  const contextIsReady = email.trim() !== "" && otp.trim() !== "";

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useForm<ResetPasswordFormValues>({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validate: validateResetPassword,
    onSubmit: async (formValues) => {
      if (!contextIsReady) {
        throw {
          message:
            "This password reset link is invalid or has expired. Please request a new OTP.",
        } as ApiError;
      }

      try {
        const payload: ResetPasswordRequestDto = {
          email,
          otp,
          newPassword: formValues.newPassword,
        };

        const response = await authService.resetPassword(payload);
        const successMessage =
          response.message || "Password reset successfully! Redirecting...";

        addToast({
          type: "success",
          message: successMessage,
        });

        setTimeout(() => {
          window.location.href = ROUTES.LOGIN;
        }, 1500);
      } catch (error: unknown) {
        const apiError = error as ToastedApiError;
        addToast({
          type: "error",
          message: apiError.message || "Unable to update password. Please try again.",
          statusCode: apiError.statusCode,
        });
        apiError._toasted = true;
        throw apiError;
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      {!contextIsReady && (
        <Alert
          type="warning"
          message="This password reset link is invalid. Please check your email or request a new OTP."
        />
      )}

      <div className="space-y-4">
        <Input
          label="New password"
          id="newPassword"
          name="newPassword"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={values.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          required
          helperText="Minimum 8 characters."
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          }
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            >
              {showPassword ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          }
        />

        <Input
          label="Confirm password"
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="••••••••"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          }
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            >
              {showConfirmPassword ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          }
        />
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={isSubmitting || !contextIsReady}
        className="h-12 w-full gap-2 rounded-xl bg-stone-700 text-base font-bold text-[#F5F0E8] shadow-none hover:bg-stone-800"
        rightIcon={!isSubmitting ? <ArrowRight className="h-4.5 w-4.5" /> : undefined}
      >
        {isSubmitting ? "Updating..." : "Reset password"}
      </Button>

      <div className="pt-2 text-center">
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex items-center gap-1 text-sm font-bold text-stone-700 transition-colors hover:text-stone-900"
        >
          <span aria-hidden="true">←</span>
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
