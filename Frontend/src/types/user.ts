import type { PageRequest } from "@/types/api";

export type UserRole = "USER" | "ADMIN" | "ITIS_MEMBER";

export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  dob?: string | null;
  studentId?: string | null;
  studentClass?: string | null;
  studentMajor?: string | null;
}

export interface CreateUserRequestDto {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: UserRole;
  firstName: string;
  lastName: string;
  dob?: string;
  studentId: string;
  studentClass?: string;
  studentMajor: string;
}

export interface UpdateUserRequestDto {
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  dob?: string;
  studentId?: string;
  studentClass?: string;
  studentMajor?: string;
}

export interface UserListParams extends PageRequest {
  search?: string;
  role?: UserRole;
  studentClass?: string;
  studentMajor?: string;
}

export interface UpdateProfileRequestDto {
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  studentClass?: string;
  studentMajor: string;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}
