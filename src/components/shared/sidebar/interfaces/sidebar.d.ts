interface SidebarProps {
  isDarkMode: boolean
  isOpen: boolean
}

interface SidebarItemProps {
  to: string
  icon: React.ReactNode
  label: string
  isDarkMode: boolean
}

interface SidebarItemWithFetchProps {
  icon: React.ReactNode
  label: string
  isDarkMode: boolean
}

interface UserData {
  id: string
  [key: string]: unknown
}

interface Business {
  id: string
  businessName: string
}

interface Account {
  id: string
  accountId: string
}
