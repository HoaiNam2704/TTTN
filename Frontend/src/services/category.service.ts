import { api } from "@/services/api";
import type { PageResponse } from "@/types/api";
import type {
  CategoryListParams,
  CategoryResponseDto,
  CreateCategoryRequestDto,
  UpdateCategoryRequestDto,
} from "@/types/category";

export class CategoryService {
  getCategories(params: CategoryListParams = {}) {
    return api.get<PageResponse<CategoryResponseDto>>("/api/v1/categories", {
      sort: "createdAt,DESC",
      ...params,
    });
  }

  getCategoryBySlug(slug: string) {
    return api.get<CategoryResponseDto>(`/api/v1/categories/${slug}`);
  }

  createCategory(data: CreateCategoryRequestDto) {
    return api.post<CategoryResponseDto>("/api/v1/admin/categories", data);
  }

  updateCategory(categoryId: string, data: UpdateCategoryRequestDto) {
    return api.patch<CategoryResponseDto>(`/api/v1/admin/categories/${categoryId}`, data);
  }

  deleteCategory(categoryId: string) {
    return api.delete<void>(`/api/v1/admin/categories/${categoryId}`);
  }
}

export const categoryService = new CategoryService();
