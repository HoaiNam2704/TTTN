"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "@/hooks/use-form";
import { validateRegister, RegisterFormValues } from "@/lib/validation";
import { authService } from "@/services/auth.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RegisterRequestDto } from "@/types/auth";
import { useToast } from "@/components/ui/toast";
import type { ApiError } from "@/services/api";
import { FilterSelect } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ToastedApiError = ApiError & { _toasted?: boolean };

export const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(true);
  
  const { addToast } = useToast();

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleCustomChange,
    handleSubmit,
  } = useForm<RegisterFormValues>({
    initialValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      phoneNumber: "",
      dob: "",
      studentId: "",
      studentClass: "",
      studentMajor: "",
    },
    validate: validateRegister,
    onSubmit: async (formValues) => {
      // 2. Prepare payload
      const payload: RegisterRequestDto = {
        username: formValues.username.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
        phoneNumber: formValues.phoneNumber.trim(),
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        dob: formValues.dob.trim(),
        studentId: formValues.studentId.trim(),
        studentClass: formValues.studentClass?.trim() || undefined,
        studentMajor: formValues.studentMajor.trim(),
      };

      try {
        // 3. API Call
        await authService.register(payload);

        addToast({
          type: "success",
          message: "Account created successfully! Redirecting to sign in...",
        });
        
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } catch (error: unknown) {
        const apiError = error as ToastedApiError;
        addToast({
          type: "error",
          message: apiError.message || "Sign up failed. Please check your information.",
          statusCode: apiError.statusCode,
        });
        apiError._toasted = true;
        throw apiError;
      }
    },
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 text-left"
    >
      {/* Row 1: Last Name & First Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <Input
          label="Last Name *"
          id="lastName"
          name="lastName"
          placeholder="Nguyen"
          value={values.lastName}
          onChange={handleChange}
          error={errors.lastName}
          required
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
        />

        <Input
          label="First Name *"
          id="firstName"
          name="firstName"
          placeholder="Harry"
          value={values.firstName}
          onChange={handleChange}
          error={errors.firstName}
          required
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
        />
      </div>

      {/* Row 2: Email & Phone Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <Input
          label="Email *"
          id="email"
          name="email"
          type="email"
          placeholder="example@eduflow.vn"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          required
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
        />

        <Input
          label="Phone Number *"
          id="phoneNumber"
          name="phoneNumber"
          placeholder="0912345678"
          value={values.phoneNumber}
          onChange={handleChange}
          error={errors.phoneNumber}
          required
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 00.996.808H10a1 1 0 01.8.4l1.3 1.8a1 1 0 001.2.3l2.85-1.2A1 1 0 0117 8.5V12a5 5 0 01-5 5H6a5 5 0 01-5-5V5z"
              />
            </svg>
          }
        />
      </div>

      {/* Row 3: Username & Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <Input
          label="Username *"
          id="username"
          name="username"
          placeholder="nguyenvan_a"
          value={values.username}
          onChange={handleChange}
          error={errors.username}
          required
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          }
        />

        <Input
          label="Password *"
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          required
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          }
        />
      </div>

      {/* Row 4: Date of Birth & Student ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <Input
          label="Date of Birth *"
          id="dob"
          name="dob"
          type="date"
          value={values.dob}
          onChange={handleChange}
          error={errors.dob}
          required
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <Input
          label="Student ID *"
          id="studentId"
          name="studentId"
          placeholder="20261234"
          value={values.studentId}
          onChange={handleChange}
          error={errors.studentId}
          required
          style={{ paddingTop: "5px", paddingBottom: "5px" }}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-6 0a2 2 0 002 2h2a2 2 0 002-2m-6 0V6" />
            </svg>
          }
        />
      </div>

      {/* Optional fields collapsible section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 bg-gray-50/50">
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="w-full flex items-center justify-between py-1.5 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 select-none focus:outline-none"
        >
          <span className="flex items-center gap-1.5 text-gray-600">
            <svg className="w-4.5 h-4.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Student information (optional)
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              showOptionalFields ? "transform rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out bg-white",
            showOptionalFields
              ? "grid-rows-[1fr] opacity-100 border-t border-gray-150"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          )}
        >
          <div className="overflow-hidden">
            <div className="p-3 space-y-3 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <Input
                  label="Student Class"
                  id="studentClass"
                  name="studentClass"
                  placeholder="CNTT-01"
                  value={values.studentClass}
                  onChange={handleChange}
                  error={errors.studentClass}
                  style={{ paddingTop: "5px", paddingBottom: "5px" }}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />

                <div className="w-full flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-gray-700 select-none">
                    Select Major
                  </span>
                  <FilterSelect
                    value={values.studentMajor || ""}
                    onChange={(val) => handleCustomChange("studentMajor", val)}
                    options={[
                      { value: "Công nghệ thông tin", label: "Information Technology" },
                      { value: "An toàn thông tin", label: "Information Security" },
                      { value: "Khoa học máy tính", label: "Computer Science" },
                    ]}
                    placeholder="Select Major..."
                    className={cn(
                      "w-full h-[36px] border bg-white rounded-lg px-3.5 text-gray-900 border-gray-300 font-normal",
                      "hover:bg-gray-50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary",
                      errors.studentMajor && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
                    )}
                    searchable={false}
                  />
                  {errors.studentMajor && (
                    <p className="text-xs text-red-600 mt-0.5">{errors.studentMajor}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        className="h-11 w-full rounded-xl bg-stone-700 text-sm font-bold text-[#F5F0E8] hover:bg-stone-800"
      >
        Sign up
      </Button>

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-[#E0D8CC]" />
        <span className="mx-4 flex-shrink select-none text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          Or sign up with
        </span>
        <div className="flex-grow border-t border-[#E0D8CC]" />
      </div>

      {/* Social login — temporarily hidden
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="google"
          className="h-10 w-full border-[#E0D8CC] bg-white text-stone-700 hover:bg-[#F5F0E8]"
          leftIcon={
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          }
        >
          Google
        </Button>
        <Button
          type="button"
          variant="facebook"
          className="h-10 w-full border-[#E0D8CC] bg-white text-stone-700 hover:bg-[#F5F0E8]"
          leftIcon={
            <svg className="mr-1.5 h-4 w-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          }
        >
          Facebook
        </Button>
      </div>
      */}

      <div className="select-none pt-1 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-stone-700 transition-colors hover:text-stone-900"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
};
