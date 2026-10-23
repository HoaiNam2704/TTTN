export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  userId: string; // uuid
  username: string;
  email: string;
  role: string;
}

export interface RegisterRequestDto {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  dob: string; // date format: YYYY-MM-DD
  firstName: string;
  lastName: string;
  studentId: string;
  studentClass?: string;
  studentMajor: string;
}

export interface RegisterResponseDto {
  userId: string; // uuid
  username: string;
  email: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  studentClass?: string;
  studentMajor?: string;
}

export interface ResetPasswordRequestDto {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
}
