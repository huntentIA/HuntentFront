export interface RefreshState {
  [key: string]: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  authorId: string;
  businessId: string;
  tags?: string[];
  mediaUrls?: string[];
}

export interface PostQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
} 