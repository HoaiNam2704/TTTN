"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Lock, UserRound } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useForm } from "@/hooks/use-form";
import { useAuth } from "@/hooks/useAuth";
import {
  validateChangePassword,
  validateProfile,
  type ChangePasswordFormValues,
  type ProfileFormValues,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import { profileService } from "@/services/profile.service";
import type { ApiError } from "@/services/api";
import { ROUTES } from "@/constants/routes";

type ToastedApiError = ApiError & { _toasted?: boolean };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  USER: "Student",
  STUDENT: "Student",
  ITIS_MEMBER: "ITIS member",
  TEACHER: "Instructor",
  LECTURER: "Instructor",
};

const MAJOR_OPTIONS = [
  { value: "Công nghệ thông tin", label: "Information Technology" },
  { value: "An toàn thông tin", label: "Information Security" },
  { value: "Khoa học máy tính", label: "Computer Science" },
];

function ProfileForms({
  profile,
}: {
  profile: {
    username: string;
    studentId?: string | null;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dob?: string | null;
    studentClass?: string | null;
    studentMajor?: string | null;
  };
}) {
  const { addToast } = useToast();
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const roleLabel =
    ROLE_LABELS[profile.role.toUpperCase()] || profile.role;

  const majorOptions = (() => {
    const current = profile.studentMajor?.trim();
    if (current && !MAJOR_OPTIONS.some((o) => o.value === current)) {
      return [{ value: current, label: current }, ...MAJOR_OPTIONS];
    }
    return MAJOR_OPTIONS;
  })();

  const profileForm = useForm<ProfileFormValues>({
    initialValues: {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      phoneNumber: profile.phoneNumber || "",
      dob: profile.dob ? String(profile.dob).slice(0, 10) : "",
      studentClass: profile.studentClass || "",
      studentMajor: profile.studentMajor || "",
    },
    validate: validateProfile,
    onSubmit: async (values) => {
      try {
        const updated = await profileService.updateProfile({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phoneNumber: values.phoneNumber.trim(),
          dob: values.dob.trim(),
          studentClass: values.studentClass.trim() || undefined,
          studentMajor: values.studentMajor.trim(),
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("email", updated.email);
          localStorage.setItem("username", updated.username);
        }
        refreshUser();
        await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });

        addToast({
          type: "success",
          message: "Profile updated successfully.",
        });
      } catch (error: unknown) {
        const apiError = error as ToastedApiError;
        addToast({
          type: "error",
          message: apiError.message || "Could not update profile.",
          statusCode: apiError.statusCode,
        });
        apiError._toasted = true;
        throw apiError;
      }
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: validateChangePassword,
    onSubmit: async (values) => {
      try {
        await profileService.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });

        passwordForm.resetForm();
        addToast({
          type: "success",
          message: "Password changed successfully.",
        });
      } catch (error: unknown) {
        const apiError = error as ToastedApiError;
        addToast({
          type: "error",
          message: apiError.message || "Could not change password.",
          statusCode: apiError.statusCode,
        });
        apiError._toasted = true;
        throw apiError;
      }
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-stone-800">
          Account information
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Update your personal profile and login password.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100">
              <UserRound className="h-4 w-4 text-stone-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-800">
                Personal information
              </h2>
              <p className="text-xs text-stone-400">
                Gray fields cannot be edited.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => void profileForm.handleSubmit(e)}
            className="space-y-4"
          >
            <div className="grid gap-3 rounded-xl border border-dashed border-stone-200 bg-stone-50/80 p-3 sm:grid-cols-3">
              <Input
                id="username"
                label="Username"
                value={profile.username}
                disabled
                readOnly
              />
              <Input
                id="studentId"
                label="Student ID"
                value={profile.studentId || "—"}
                disabled
                readOnly
              />
              <Input
                id="role"
                label="Role"
                value={roleLabel}
                disabled
                readOnly
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="firstName"
                name="firstName"
                label="First name *"
                value={profileForm.values.firstName}
                onChange={profileForm.handleChange}
                error={profileForm.errors.firstName}
              />
              <Input
                id="lastName"
                name="lastName"
                label="Last name *"
                value={profileForm.values.lastName}
                onChange={profileForm.handleChange}
                error={profileForm.errors.lastName}
              />
              <Input
                id="email"
                name="email"
                type="email"
                label="Email *"
                value={profileForm.values.email}
                onChange={profileForm.handleChange}
                error={profileForm.errors.email}
              />
              <Input
                id="phoneNumber"
                name="phoneNumber"
                label="Phone number *"
                value={profileForm.values.phoneNumber}
                onChange={profileForm.handleChange}
                error={profileForm.errors.phoneNumber}
              />
              <Input
                id="dob"
                name="dob"
                type="date"
                label="Date of birth *"
                value={profileForm.values.dob}
                onChange={profileForm.handleChange}
                error={profileForm.errors.dob}
              />
              <Input
                id="studentClass"
                name="studentClass"
                label="Class"
                value={profileForm.values.studentClass}
                onChange={profileForm.handleChange}
                error={profileForm.errors.studentClass}
              />

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="select-none text-xs font-medium text-foreground">
                  Major
                </span>
                <FilterSelect
                  value={profileForm.values.studentMajor || ""}
                  onChange={(val) =>
                    profileForm.handleCustomChange("studentMajor", val)
                  }
                  options={majorOptions}
                  placeholder="Select a major..."
                  className={cn(
                    "h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-stone-800",
                    "hover:bg-stone-50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary",
                    profileForm.errors.studentMajor &&
                      "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
                  )}
                  searchable={false}
                />
                {profileForm.errors.studentMajor && (
                  <p className="mt-0.5 text-xs text-red-600">
                    {profileForm.errors.studentMajor}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={profileForm.isSubmitting}
                className="min-w-[140px]"
              >
                {profileForm.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm lg:sticky lg:top-20">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100">
              <Lock className="h-4 w-4 text-stone-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-800">
                Change password
              </h2>
              <p className="text-xs text-stone-400">
                Enter your current password and a new password.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => void passwordForm.handleSubmit(e)}
            className="grid gap-3"
          >
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              label="Current password *"
              value={passwordForm.values.currentPassword}
              onChange={passwordForm.handleChange}
              error={passwordForm.errors.currentPassword}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={
                    showCurrentPassword ? "Hide password" : "Show password"
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
            <Input
              id="newPassword"
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              label="New password *"
              value={passwordForm.values.newPassword}
              onChange={passwordForm.handleChange}
              error={passwordForm.errors.newPassword}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              label="Confirm new password *"
              value={passwordForm.values.confirmPassword}
              onChange={passwordForm.handleChange}
              error={passwordForm.errors.confirmPassword}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                disabled={passwordForm.isSubmitting}
                className="min-w-[140px]"
              >
                {passwordForm.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change password"
                )}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const {
    data: profile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileService.getMe(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isAuthLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-muted/40">
      <DashboardHeader />

      {isAuthLoading || isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      ) : isError ? (
        <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
          <Alert
            type="error"
            message={
              (error as ApiError)?.message ||
              "Could not load account information."
            }
          />
        </div>
      ) : profile ? (
        <ProfileForms profile={profile} />
      ) : null}
    </div>
  );
}
