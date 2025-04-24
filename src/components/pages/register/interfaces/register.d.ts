export interface RegisterRequest {
  name: string
  email: string
  businessName: string
  password: string
  confirmPassword: string
}

export interface RegisterResponse {
  id: number
  name: string
  email: string
}

export interface BusinessRegisterRequest {
  businessName: string
  userIDs: string[]
  instagramAccount?: string
  objective?: number[]
  targetAudience?: string
  valueProposition?: string
  whatTheBusinessSells?: string
  brandTone?: string
  allowControversialTopics?: boolean
}

export interface BusinessRegisterResponse {
  id: number
  name: string
  industry: string
}
