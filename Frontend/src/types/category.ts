import type { PageRequest } from "@/types/api";

export interface CategoryResponseDto {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  courseCount?: number;
}

export interface CreateCategoryRequestDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequestDto {
  name?: string;
  description?: string;
}

export type CategoryListParams = PageRequest;
