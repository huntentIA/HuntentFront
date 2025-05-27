interface UpdatePost {
    id: string
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
    hash_tags: string[]
    media_url: string
}