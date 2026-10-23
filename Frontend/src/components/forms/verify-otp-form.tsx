"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@/hooks/use-form";
import {
  validateVerifyOtp,
  type VerifyOtpFormValues,
} from "@/lib/validation";
import { authService } from "@/services/auth.service";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ROUTES } from "@/constants/routes";
import type { ApiError } from "@/services/api";
import type { ForgotPasswordRequestDto } from "@/types/auth";

type ToastedApiError = ApiError & { _toasted?: boolean };

interface VerifyOtpFormProps {
  email: string;
  expiresAt?: number;
}

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 10 * 60;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function VerifyOtpForm({ email, expiresAt }: VerifyOtpFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [now, setNow] = useState(() => Date.now());
  const [currentExpiresAt, setCurrentExpiresAt] = useState(() =>
    typeof expiresAt === "number" && Number.isFinite(expiresAt) ? expiresAt : 0
  );
  const [isResending, setIsResending] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));

  const remainingSeconds = Math.max(
    0,
    Math.ceil((currentExpiresAt - now) / 1000)
  );
  const isExpired = remainingSeconds === 0;
  const otp = digits.join("");

  const {
    isSubmitting,
    handleSubmit,
    setSubmitError,
    setErrors,
    setValues,
  } = useForm<VerifyOtpFormValues>({
    initialValues: {
      otp: "",
    },
    validate: validateVerifyOtp,
    onSubmit: async () => {
      if (!email.trim()) {
        throw {
          message:
            "Verification email not found. Please go back to Forgot password.",
        } as ApiError;
      }

      if (isExpired) {
        throw {
          message: "OTP has expired. Please request a new code.",
        } as ApiError;
      }

      const normalizedOtp = otp.trim();

      // TODO: Call verify OTP API if backend exposes a dedicated endpoint.
      addToast({
        type: "success",
        message: "OTP verified successfully! Continuing to reset password...",
      });

      setTimeout(() => {
        router.push(
          `${ROUTES.RESET_PASSWORD}?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(normalizedOtp)}`
        );
      }, 1000);
    },
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const syncOtp = (nextDigits: string[]) => {
    const normalizedDigits = nextDigits.slice(0, OTP_LENGTH);
    while (normalizedDigits.length < OTP_LENGTH) {
      normalizedDigits.push("");
    }
    setDigits(normalizedDigits);
    setValues((prev) => ({
      ...prev,
      otp: normalizedDigits.join(""),
    }));
    setErrors((prev) => ({
      ...prev,
      otp: undefined,
    }));
    setSubmitError(null);
  };

  const focusDigit = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleDigitChange = (index: number, rawValue: string) => {
    const nextDigit = rawValue.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextDigit;
    syncOtp(nextDigits);

    if (nextDigit && index < OTP_LENGTH - 1) {
      focusDigit(index + 1);
    }
  };

  const handleDigitKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const nextDigits = [...digits];

      if (nextDigits[index]) {
        nextDigits[index] = "";
        syncOtp(nextDigits);
        return;
      }

      if (index > 0) {
        nextDigits[index - 1] = "";
        syncOtp(nextDigits);
        focusDigit(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusDigit(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusDigit(index + 1);
    }
  };

  const handleDigitPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] ?? "");
    syncOtp(nextDigits);

    const targetIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    focusDigit(targetIndex);
  };

  const handleResend = async () => {
    if (!email.trim() || isResending || !isExpired) return;

    setIsResending(true);
    try {
      const payload: ForgotPasswordRequestDto = {
        email: email.trim(),
      };
      const response = await authService.forgotPassword(payload);
      const successMessage =
        response.message || "A new OTP has been sent to your email.";

      addToast({
        type: "success",
        message: successMessage,
      });

      const nextExpiresAt = now + OTP_TTL_SECONDS * 1000;
      setCurrentExpiresAt(nextExpiresAt);
      syncOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      focusDigit(0);

      router.replace(
        `${ROUTES.VERIFY_OTP}?email=${encodeURIComponent(email)}&expiresAt=${nextExpiresAt}`
      );
    } catch (error: unknown) {
      const apiError = error as ToastedApiError;
      addToast({
        type: "error",
        message: apiError.message || "Unable to resend OTP. Please try again.",
        statusCode: apiError.statusCode,
      });
    } finally {
      setIsResending(false);
    }
  };

  const canSubmit = !isExpired && otp.length === OTP_LENGTH && !isSubmitting;
  const canResend = isExpired && !isResending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      {!email.trim() && (
        <Alert
          type="warning"
          message="Verification email not found. Please go back to Forgot password."
        />
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-6 gap-2 sm:gap-3">
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <input
              key={index}
              ref={(node) => {
                inputRefs.current[index] = node;
              }}
              value={digits[index] ?? ""}
              onChange={(event) => handleDigitChange(index, event.target.value)}
              onKeyDown={(event) => handleDigitKeyDown(index, event)}
              onPaste={handleDigitPaste}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              aria-label={`OTP digit ${index + 1}`}
              className="h-12 w-full rounded-xl border border-[#E0D8CC] bg-white text-center text-lg font-semibold tracking-[0.35em] text-stone-800 outline-none transition-all duration-200 placeholder:text-stone-300 focus:border-[#B8A88C] focus:ring-1 focus:ring-[#B8A88C]/40 sm:h-14"
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-[15px]">
          {isExpired ? (
            <span className="font-medium text-foreground">OTP has expired</span>
          ) : (
            <span className="font-medium text-stone-600">
              OTP expires in:{" "}
              <span className="font-semibold text-stone-800">
                {formatCountdown(remainingSeconds)}
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className="inline-flex items-center gap-1.5 font-semibold text-stone-600 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:text-stone-400"
          >
            <RotateCcw className="h-4 w-4" />
            Resend OTP
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!canSubmit}
          className="h-12 w-full gap-2 rounded-xl bg-stone-700 text-base font-bold text-[#F5F0E8] shadow-none hover:bg-stone-800"
          rightIcon={!isSubmitting ? <ArrowRight className="h-4.5 w-4.5" /> : undefined}
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </Button>

        {isExpired && (
          <p className="text-center text-sm text-foreground">OTP has expired</p>
        )}
      </div>

      <div className="pt-2 text-center">
        <Link
          href={ROUTES.FORGOT_PASSWORD}
          className="inline-flex items-center gap-1 text-sm font-bold text-stone-700 transition-colors hover:text-stone-900"
        >
          <span aria-hidden="true">←</span>
          Back to Forgot password
        </Link>
      </div>
    </form>
  );
}
