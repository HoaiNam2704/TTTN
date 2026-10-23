import type { PageRequest } from "@/types/api";

export interface SectionResponseDto {
  id: string; // uuid
  courseId: string; // uuid
  title: string;
  description?: string;
  sortOrder: number;
}

export interface CreateSectionRequestDto {
  courseId: string; // uuid
  title: string;
  description?: string;
}

export interface UpdateSectionRequestDto {
  title: string;
  description?: string;
}

export interface ReorderSectionsRequestDto {
  sectionIds: string[];
}

export interface SectionListParams extends PageRequest {
  courseId?: string;
}
