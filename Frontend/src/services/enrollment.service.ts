import { api } from "@/services/api";
import type {
  EnrollmentResponseDto,
  CreateEnrollmentRequestDto,
  UpdateProgressPercentRequestDto,
} from "@/types/enrollment";

export class EnrollmentService {
  createEnrollment(data: CreateEnrollmentRequestDto) {
    return api.post<EnrollmentResponseDto>("/api/v1/enrollments", data);
  }

  updateProgressPercent(enrollmentId: string, data: UpdateProgressPercentRequestDto) {
    return api.put<EnrollmentResponseDto>(`/api/v1/enrollments/${enrollmentId}/progress-percent`, data);
  }

  deleteEnrollment(enrollmentId: string) {
    return api.delete<void>(`/api/v1/enrollments/${enrollmentId}`);
  }
}

export const enrollmentService = new EnrollmentService();
