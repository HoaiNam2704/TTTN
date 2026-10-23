import {
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
} from "@/types/auth";
import { ValidationErrors } from "@/hooks/use-form";

// Regular expressions
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateLogin(values: LoginRequestDto): ValidationErrors<LoginRequestDto> {
  const errors: ValidationErrors<LoginRequestDto> = {};

  if (!values.username || values.username.trim() === "") {
    errors.username = "Username is required";
  }

  if (!values.password) {
    errors.password = "Password is required";
  }

  return errors;
}

export function validateForgotPassword(
  values: ForgotPasswordRequestDto
): ValidationErrors<ForgotPasswordRequestDto> {
  const errors: ValidationErrors<ForgotPasswordRequestDto> = {};

  if (!values.email || values.email.trim() === "") {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = "Invalid email";
  }

  return errors;
}

export interface VerifyOtpFormValues {
  otp: string;
}

export function validateVerifyOtp(
  values: VerifyOtpFormValues
): ValidationErrors<VerifyOtpFormValues> {
  const errors: ValidationErrors<VerifyOtpFormValues> = {};

  if (!values.otp || values.otp.trim() === "") {
    errors.otp = "Please enter the OTP code";
  } else if (!/^\d{6}$/.test(values.otp)) {
    errors.otp = "OTP must be exactly 6 digits";
  }

  return errors;
}

export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export function validateResetPassword(
  values: ResetPasswordFormValues
): ValidationErrors<ResetPasswordFormValues> {
  const errors: ValidationErrors<ResetPasswordFormValues> = {};

  if (!values.newPassword) {
    errors.newPassword = "Password is required";
  } else if (values.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters";
  } else if (values.newPassword.length > 100) {
    errors.newPassword = "Password must not exceed 100 characters";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

export type RegisterFormValues = RegisterRequestDto;

export function validateRegister(
  values: RegisterFormValues
): ValidationErrors<RegisterFormValues> {
  const errors: ValidationErrors<RegisterFormValues> = {};

  if (!values.firstName || values.firstName.trim() === "") {
    errors.firstName = "First name is required";
  }

  if (!values.lastName || values.lastName.trim() === "") {
    errors.lastName = "Last name is required";
  }

  if (!values.username || values.username.trim() === "") {
    errors.username = "Username is required";
  } else if (values.username.length < 3) {
    errors.username = "Username must be at least 3 characters";
  } else if (values.username.length > 50) {
    errors.username = "Username must not exceed 50 characters";
  }

  if (!values.email || values.email.trim() === "") {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = "Invalid email (e.g. name@company.com)";
  }

  if (!values.phoneNumber || values.phoneNumber.trim() === "") {
    errors.phoneNumber = "Phone number is required";
  } else if (!PHONE_REGEX.test(values.phoneNumber)) {
    errors.phoneNumber = "Phone number must be exactly 10 digits";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  } else if (values.password.length > 100) {
    errors.password = "Password must not exceed 100 characters";
  }

  if (!values.dob || values.dob.trim() === "") {
    errors.dob = "Date of birth is required";
  } else if (!DATE_REGEX.test(values.dob)) {
    errors.dob = "Date of birth must be in YYYY-MM-DD format";
  }

  if (!values.studentId || values.studentId.trim() === "") {
    errors.studentId = "Student ID is required";
  }

  return errors;
}

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  studentClass: string;
  studentMajor: string;
}

export function validateProfile(
  values: ProfileFormValues
): ValidationErrors<ProfileFormValues> {
  const errors: ValidationErrors<ProfileFormValues> = {};

  if (!values.firstName || values.firstName.trim() === "") {
    errors.firstName = "First name is required";
  }

  if (!values.lastName || values.lastName.trim() === "") {
    errors.lastName = "Last name is required";
  }

  if (!values.email || values.email.trim() === "") {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = "Invalid email (e.g. name@company.com)";
  }

  if (!values.phoneNumber || values.phoneNumber.trim() === "") {
    errors.phoneNumber = "Phone number is required";
  } else if (!PHONE_REGEX.test(values.phoneNumber)) {
    errors.phoneNumber = "Phone number must be exactly 10 digits";
  }

  if (!values.dob || values.dob.trim() === "") {
    errors.dob = "Date of birth is required";
  } else if (!DATE_REGEX.test(values.dob)) {
    errors.dob = "Date of birth must be in YYYY-MM-DD format";
  }

  return errors;
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function validateChangePassword(
  values: ChangePasswordFormValues
): ValidationErrors<ChangePasswordFormValues> {
  const errors: ValidationErrors<ChangePasswordFormValues> = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Current password is required";
  }

  if (!values.newPassword) {
    errors.newPassword = "New password is required";
  } else if (values.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters";
  } else if (values.newPassword.length > 100) {
    errors.newPassword = "Password must not exceed 100 characters";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}
