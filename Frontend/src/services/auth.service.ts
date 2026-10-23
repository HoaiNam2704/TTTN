import { api } from "./api";
import { MessageResponseDto } from "@/types/api";
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  ResetPasswordRequestDto,
  ForgotPasswordRequestDto,
  RefreshTokenResponseDto,
} from "@/types/auth";

export interface IAuthService {
  login(data: LoginRequestDto): Promise<LoginResponseDto>;
  register(data: RegisterRequestDto): Promise<RegisterResponseDto>;
  logout(): Promise<MessageResponseDto>;
  resetPassword(data: ResetPasswordRequestDto): Promise<MessageResponseDto>;
  forgotPassword(data: ForgotPasswordRequestDto): Promise<MessageResponseDto>;
  refresh(): Promise<RefreshTokenResponseDto>;
}

export class AuthService implements IAuthService {
  async login(data: LoginRequestDto): Promise<LoginResponseDto> {
    return api.post<LoginResponseDto>("/api/v1/auth/login", data);
  }

  async register(data: RegisterRequestDto): Promise<RegisterResponseDto> {
    return api.post<RegisterResponseDto>("/api/v1/auth/register", data);
  }

  async logout(): Promise<MessageResponseDto> {
    return api.post<MessageResponseDto>("/api/v1/auth/logout");
  }

  async resetPassword(data: ResetPasswordRequestDto): Promise<MessageResponseDto> {
    return api.post<MessageResponseDto>("/api/v1/auth/reset-password", data);
  }

  async forgotPassword(data: ForgotPasswordRequestDto): Promise<MessageResponseDto> {
    return api.post<MessageResponseDto>("/api/v1/auth/forgot-password", data);
  }

  async refresh(): Promise<RefreshTokenResponseDto> {
    return api.post<RefreshTokenResponseDto>("/api/v1/auth/refresh");
  }
}

export const authService = new AuthService();
