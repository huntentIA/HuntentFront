interface ApiResponse {
  success: boolean
  message: string
  data?: unknown
}

interface GetPostResponse {
  hashtags: string
  postUrl: string
  publicationDate: string
  saves: number
  likes: number
  totalInteractions: number
  accountID: string
  status: string
  comments: number
  outliers: number
  views: number
  postEngagement: number
  contentFormat: string
  description: string
  id: string
  creatorAccount: string
  mediaURL: string
  shares: number
}
