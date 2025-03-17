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
}

export interface BusinessRegisterResponse {
  id: number
  name: string
  industry: string
}
