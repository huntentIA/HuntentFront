import { AccountData } from './referent-search-service'

interface bussinessAccountResponse {
  businessId: string
  accountId: string
  id: string
}

interface getBusinessAccountsByIdResponse {
  bussinessId: string
  accounts: AccountData[]
}

interface getBusinessAccountsResponse {
  businessId: string
  accountId: string
  id: string
}

interface DeleteBussinessAccountResponse {
  accountId: string
  message: string
}
