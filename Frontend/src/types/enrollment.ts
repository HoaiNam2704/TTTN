export interface EnrollmentResponseDto {
  id: string;
  userId: string;
  courseId: string;
  progressPercent: number;
}

export interface CreateEnrollmentRequestDto {
  courseId: string;
  userId: string;
}

export interface UpdateProgressPercentRequestDto {
  progressPercent: number;
}

/** Response of POST /api/v1/lessons/{lessonId}/complete */
export interface ProgressUpdatePayloadDto {
  enrollmentId?: string;
  lessonId?: string;
  progressPercent?: number;
  newlyCompleted?: boolean;
}
