export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ContentFormat = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
export type SortDirection = 'asc' | 'desc'

export interface RefreshState {
  [key: string]: boolean;
} 

export interface Post {
  id: string
  accountID: string
  accountName?: string
  description: string
  status: string
  mediaURL: string
  publicationDate: string
  publicationTime: string
  publication_id: string
  permalink?: string
  likes: number
  comments: number
  shares: number
  saves: number
  views?: number
  totalInteractions: number
  postEngagement: number
  hashtags: string[]
  postURL: string
  contentFormat: ContentFormat
  creatorAccount: string
  outliers?: string
  videoTranscript?: string
  createdAt?: string
  updatedAt?: string
  caption?: string
  topics?: string
  rights?: string
  call_to_action?: string
  averageEngagement?: number
  carousel_items?: string[]
  objective?: string
  scriptAdaptation?: string
  content_objectives?: string[]
  content_topics?: string[]
  businessPostStatus?: string
  content_adapter?: string
  global_content_analysis?: string
  hook?: string
  pain_or_desire?: PainOrDesire
  narrative_structure?: string
  downloadable_type?: boolean
  brand_tone_business?: string
  target_audience_business?: string
  businessPostId?: string
  businessId?: string
  // Add any other properties your posts have
}

export interface SortConfig {
  key: string
  direction: SortDirection
}

export interface PostQueryParams {
  limit?: string
  page_number?: string
  page_token?: string
  prev_token?: string
  is_prev_page?: boolean
  account_ids?: string[]
  content_format?: string
  status?: ApprovalStatus
  creator_accounts?: string[]
  next_token?: string
  prev_token?: string
  sort_by?: string
  page?: number
  sort_order?: SortDirection
  last_item_id?: string
  last_publication_date?: string
  min_date?: string
  max_date?: string
  publication_date_end?: string
}

export interface PostResponse {
  items: Post[]
  next_token?: string
}
