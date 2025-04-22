export interface InstagramAccountResponse {
  socialNetwork: string
  account_name: string
  account_id: string
  short_description: string
  detailed_description: string
  followers_count: number
  follows_count: number
  media_count: number
  profile_picture_url: string
  average_interactions_by_publication: number
  total_account_interactions_last_25_publications: number
  average_engagement: number
  publication_basic_data: PublicationBasicData[]
}

export interface PublicationBasicData {
  owner_account: string
  publication_id: string
  description: string
  media_type: string
  instagram_media_type: string
  creation_date_and_time: string
  comments_count: number
  likes_count: number
  interactions_count: number
  permalink: string
  hash_tags: string | null
  media_url: string 
  engagement: number
  outliers: number
  carousel_items: CarouselMediaItem[] | null
}

interface AccountData {
  socialNetwork: string
  accountName: string
  accountType: string
  businessID: string
  account_id: string
  short_description: string
  detailed_description: string
  followers_count: number
  follows_count: number
  media_count: number
  profile_picture_url: string
  average_interactions_by_publication: number
  total_account_interactions_last_25_publications: number
  average_engagement: number
  id?: string
  publication_basic_data?: PublicationBasicData[]
  businessAccountId?: string
  updated_at?: Date
  posts_count?: number
}

interface CarouselMediaItem {
  media_type: string;
  media_url: string;
}
