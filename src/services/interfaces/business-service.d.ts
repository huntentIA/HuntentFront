export type BusinessesAccountResponse = {
  id: string
  businessName: string
  userIDs: string[]
  contentFormat: string
  instagramAccount?: string
  objective?: number[]
  targetAudience?: string
  valueProposition?: string
  whatTheBusinessSells?: string
  productBenefits?: string
  brandTone?: string
  allowControversialTopics?: boolean
}[]


export interface BusinessUpdateData {
  id: string;
  businessName: string
  userIDs: string[]
  instagramAccount: string
  objective: string[]
  targetAudience: string
  valueProposition: string
  whatTheBusinessSells: string
  productBenefits: string
  brandTone: string
  allowControversialTopics: boolean
}

export interface BusinessUpdateResponse {
  message: string;
  updatedAttributes: updatedAttributes

}


export interface updatedAttributes {
  brandTone: string;
  differentiators: string;
  productBenefits: string;
  userIDs: string[];
  businessName: string;
  targetAudience: string;
  valueProposition: string;
  objective: string;
  whatTheBusinessSells: string;
  productBenefits: string;
  allowControversialTopics: boolean;
}

