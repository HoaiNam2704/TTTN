import { api } from "@/services/api";
import type { MessageResponseDto, PageResponse } from "@/types/api";
import type {
  CreateUserRequestDto,
  UpdateUserRequestDto,
  UserListParams,
  UserResponseDto,
} from "@/types/user";

export class UserService {
  getUsers(params: UserListParams = {}) {
    return api.get<PageResponse<UserResponseDto>>("/api/v1/admin/users", {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getStudentClasses() {
    return api.get<string[]>("/api/v1/admin/users/classes");
  }

  getStudentMajors() {
    return api.get<string[]>("/api/v1/admin/users/majors");
  }

  getUserById(userId: string) {
    return api.get<UserResponseDto>(`/api/v1/admin/users/${userId}`);
  }

  createUser(data: CreateUserRequestDto) {
    return api.post<UserResponseDto>("/api/v1/admin/users", data);
  }

  updateUser(userId: string, data: UpdateUserRequestDto) {
    return api.patch<UserResponseDto>(`/api/v1/admin/users/${userId}`, data);
  }

  deleteUser(userId: string) {
    return api.delete<void>(`/api/v1/admin/users/${userId}`);
  }

  importUsersFromCSV(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<MessageResponseDto>("/api/v1/admin/users/import", formData);
  }
}

export const userService = new UserService();
