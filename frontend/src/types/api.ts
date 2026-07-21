/** Generic envelope types shared with the FastAPI backend's response shapes. */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorBody {
  detail: string;
  code?: string;
}
