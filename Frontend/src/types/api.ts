export interface SortObject {
  sorted?: boolean;
  unsorted?: boolean;
  empty?: boolean;
}

export interface PageableObject {
  unpaged?: boolean;
  paged?: boolean;
  pageNumber?: number;
  pageSize?: number;
  offset?: number;
  sort?: SortObject;
}

/** Spring Page payload — aligned with OpenAPI page wrappers. */
export interface PageResponse<T> {
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: T[];
  number: number;
  empty: boolean;
  pageable?: PageableObject;
  sort?: SortObject;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string | string[];
}

export interface MessageResponseDto {
  message?: string;
}
