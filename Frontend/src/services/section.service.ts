import { api } from "@/services/api";
import type { PageResponse } from "@/types/api";
import type {
  SectionResponseDto,
  CreateSectionRequestDto,
  UpdateSectionRequestDto,
  ReorderSectionsRequestDto,
  SectionListParams,
} from "@/types/section";

export class SectionService {
  getSections(params: SectionListParams = {}) {
    return api.get<PageResponse<SectionResponseDto>>("/api/v1/sections", {
      sort: "sortOrder,ASC",
      ...params,
    });
  }

  getSectionById(sectionId: string) {
    return api.get<SectionResponseDto>(`/api/v1/sections/${sectionId}`);
  }

  createSection(data: CreateSectionRequestDto) {
    return api.post<SectionResponseDto>("/api/v1/admin/sections", data);
  }

  updateSection(sectionId: string, data: UpdateSectionRequestDto) {
    return api.put<SectionResponseDto>(`/api/v1/admin/sections/${sectionId}`, data);
  }

  deleteSection(sectionId: string) {
    return api.delete<void>(`/api/v1/admin/sections/${sectionId}`);
  }

  reorderSections(courseId: string, data: ReorderSectionsRequestDto) {
    return api.post<void>(`/api/v1/admin/sections/${courseId}/reorder`, data);
  }
}

export const sectionService = new SectionService();
