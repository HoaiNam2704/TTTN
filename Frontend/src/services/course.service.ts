import { api } from "@/services/api";
import type { PageResponse } from "@/types/api";
import type {
  CourseListParams,
  AdminCourseResponseDto,
  UserCourseResponseDto,
  CreateCourseRequestDto,
  UpdateCourseRequestDto,
  CourseDetailResponseDto,
} from "@/types/course";

/** Convert an object into FormData for multipart/form-data requests */
function toFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  }
  return formData;
}

export class CourseService {
  getCourses(params: CourseListParams = {}) {
    return api.get<PageResponse<UserCourseResponseDto>>("/api/v1/courses", {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getCourseById(courseId: string) {
    return api.get<UserCourseResponseDto>(`/api/v1/courses/${courseId}`);
  }

  getCoursesByUserId(userId: string, params: CourseListParams = {}) {
    return api.get<PageResponse<UserCourseResponseDto>>(`/api/v1/courses/user/${userId}`, {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getCourseBySlug(slug: string) {
    return api.get<UserCourseResponseDto>(`/api/v1/courses/slug/${slug}`);
  }

  createCourse(data: CreateCourseRequestDto) {
    return api.post<AdminCourseResponseDto>("/api/v1/admin/courses", toFormData({
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      status: data.status,
      level: data.level,
      price: data.price,
      thumbnail: data.thumbnail,
    }));
  }

  updateCourse(courseId: string, data: UpdateCourseRequestDto) {
    return api.patch<AdminCourseResponseDto>(`/api/v1/admin/courses/${courseId}`, toFormData({
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      status: data.status,
      level: data.level,
      price: data.price,
      thumbnail: data.thumbnail,
    }));
  }

  deleteCourse(courseId: string) {
    return api.delete<void>(`/api/v1/admin/courses/${courseId}`);
  }

  getCourseCurriculum(courseId: string) {
    return api.get<CourseDetailResponseDto>(`/api/v1/courses/${courseId}/curriculum`);
  }
}

export const courseService = new CourseService();
