export interface RefreshState {
  [key: string]: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  authorId: string;
  businessId: string;
  tags?: string[];
  mediaUrls?: string[];
  publicationDate?: string;
  contentFormat?: string;
  mediaURL?: string;
  caption?: string;
  creatorAccount?: string;
  likes?: number;
  comments?: number;
  postURL?: string;
  description?: string;
  hashtags?: string[];
  videoTranscript?: string;
  carousel_items?: Array<{
    mediaURL: string;
    caption?: string;
  }>;
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