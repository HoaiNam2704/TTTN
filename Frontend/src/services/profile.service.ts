import { api } from "@/services/api";
import type { MessageResponseDto } from "@/types/api";
import type {
  ChangePasswordRequestDto,
  UpdateProfileRequestDto,
  UserResponseDto,
} from "@/types/user";

export class ProfileService {
  getMe() {
    return api.get<UserResponseDto>("/api/v1/users/me");
  }

  updateProfile(data: UpdateProfileRequestDto) {
    return api.patch<UserResponseDto>("/api/v1/users/me", data);
  }

  changePassword(data: ChangePasswordRequestDto) {
    return api.post<MessageResponseDto>("/api/v1/users/me/change-password", data);
  }
}

export const profileService = new ProfileService();
