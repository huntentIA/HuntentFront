export interface BusinessPostData {
  businessId: string
  postId: string
  publicationDate: Date
  status: string
  businessId: string
  businessPostId: string
  postId: string
  publicationDate: Date
  status: string
  accountId: string
  comments: number
  contentFormat: string
  creatorAccount: string
  description: string
  hashtags: string[]
  likes: number
  mediaURL: string
  outliers?: string
  postEngagement: number
  postURL: string
  publicationTime: string
  saves: number
  shares: number
  totalInteractions: number
  content_topics?: string[]
  content_objectives?: string[]
  hook?: string,
  call_to_action?: string,
  has_downloadable?: boolean,
  downloadable_type?: string,
  narrative_structure?: string,
  carousel_items?: CarouselMediaItem[]
  pain_or_desire?: PainOrDesire[]
  brand_affinity_score?: number
  global_content_analysis?: string
  content_adapter?: string
  videoTranscript?: string
  businessPostStatus?: string
  id?: string
}

export interface PainOrDesire {
  pain: string,
  desire: string
}

export interface BusinessPostDataCreate {
  postId: string
  businessId: string
  publicationDate: Date
  status: string
  contentFormat: string
}

export type BusinessPostResponse = {
  message: string
  businessPost: BusinessPostData
}

export interface BusinessPostQueryParams {
    businessId?: string
    limit?: string
    page_number?: string
    page_token?: string
    prev_token?: string
    is_prev_page?: boolean
    all?: boolean
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    min_date?: string 
    max_date?: string 
    status?: string | string[]
    content_format?: string
    creator_account?: string
    creator_accounts?: string[] 
    account_ids?: string[]
    publication_date_start?: string 
    publication_date_end?: string
}

interface GetPostResponse {
    items: BusinessPostData[]
    count: number
    total_items: number 
    next_page_token: string | null 
    prev_page_token: string | null 
    current_token: string 
    total_pages: number
    page_number: number 
    items_per_page: number 
    has_more: boolean 
}

export interface UpdateContentAdapter {
   description: string,
   brand_tone_business: string,
   target_audience_business: string,
   objective: string[],
   contentFormat: string,
   content_topics: string[],
   pain_or_desire: PainOrDesire[],
   downloadable_type?: string,
   narrative_structure?: string,
   global_content_analysis?: string,
   video_transcription?: string,
   use_ai?: boolean,
   content_adapter?: string
}

export interface ContentAnalysisData {
  brand_tone: string,
  target_audience: string,
  outliers: number | null,
  brand_tone_business: string,
  objective: string,
  contentFormat: string,
  likes: number,
  comments: number,
  total_interactions: number,
  description: string,
  target_audience_business?: string,
  video_transcription?: string,
}

interface ApiResponse {
  success: boolean
  message: string
  data: {
    [key: string]: unknown
  }
}