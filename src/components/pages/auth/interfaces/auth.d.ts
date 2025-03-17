export interface LoginRequest {
  email: string
  password: string
}

export interface GoogleLoginRequest {
  token: string;
}

export interface LoginResponse {
  token: string
  id: number
  name: string
  email: string
  role: string
  
}
