import { NavLink} from 'react-router-dom'
/* import BussinessService from '../../../services/business.service'
import { BusinessesAccountResponse } from '../../../services/interfaces/business-service'
import { getBusinessAccountsByIdResponse } from '../../../services/interfaces/business-account-service'
import businessAccountService from '../../../services/business-account.service' */
import { Brain, HardDrive, Users, Check } from 'lucide-react'
import logo from '../../../assets/huntent-logo.webp'
const Sidebar: React.FC<SidebarProps> = ({ isDarkMode, isOpen }) => {
  return (
    <nav
      className={`fixed left-0 top-0 z-20 h-full w-64 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out ${
        isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
      } flex flex-col justify-between border-r p-6 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}
    >
      <div>
        <div className="mb-8 flex items-center">
          {/* <img src={logo} alt="Logo" className="h-8 w-auto" /> */}
          <span className="ml-2 text-lg font-semibold text-orange-600">
            <img src={logo} alt="Logo" className="mb-4 h-8 w-auto" />
          </span>
        </div>

        <div className="mb-8">
          <h3
            className={`${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            } mb-3 text-xs font-medium uppercase`}
          >
            Bases
          </h3>
          <ul className="space-y-2">
            <SidebarItem
              to="/userAccount"
              icon={<Users size={20} />}
              label="Directorio de referentes"
              isDarkMode={isDarkMode}
            />
            <SidebarItem
              to="/knowledgeBaseView"
              icon={<HardDrive size={20} />}
              label="Base de Conocimiento"
              isDarkMode={isDarkMode}
            />
          </ul>
        </div>

        <div>
          <h3
            className={`${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            } mb-3 text-xs font-medium uppercase`}
          >
            Planificación
          </h3>
          <ul className="space-y-2">
            <SidebarItem
              to="/referentSearch"
              icon={<HardDrive size={20} />}
              label="Selección Cuentas"
              isDarkMode={isDarkMode}
            />
            <SidebarItem
              to="/contentPlanner"
              icon={<Brain size={20} />}
              label="Planificador de Contenido"
              isDarkMode={isDarkMode}
            />
            <SidebarItem
              to="/approveContentPlanner"
              icon={<Check size={20} />}
              label="Publicaciones Aprobadas"
              isDarkMode={isDarkMode}
            />
          </ul>
        </div>
      </div>
    </nav>
  )
}

/**
 * Sidebar item that fetches data before navigation
 */
/* const SidebarItemWithFetch: React.FC<SidebarItemWithFetchProps> = ({
  icon,
  label,
  isDarkMode,
}) => {
  const navigate = useNavigate()

  const handleContentPlannerClick = async (): Promise<void> => {
    try {
      const userDataString = localStorage.getItem('userData')

      if (!userDataString) {
        throw new Error('User data not found in localStorage')
      }

      const user: UserData = JSON.parse(userDataString)
      const userId = user.id

      const businessResponse: BusinessesAccountResponse | null =
        await BussinessService.getBusinessIdByUserId(userId)

      if (!businessResponse || !businessResponse.length) {
        throw new Error('No business found for user')
      }

      const business: Business[] = businessResponse.map((response) => ({
        id: response.id,
        businessName: response.businessName,
        userIDs: response.userIDs,
      }))

      if (!business || business.length === 0) {
        throw new Error('No business found for user')
      }

      const businessId = business[0].id
      const accountResponse: getBusinessAccountsByIdResponse =
        await businessAccountService.getAccountByBusinessId(businessId)
      const accounts: Account[] =
        accountResponse.accounts.length > 0
          ? accountResponse.accounts.map((acc) => ({
              id: acc.id || '',
              accountId: acc.id || '',
            }))
          : []

      const createdAccountIds = accounts
        .filter((account) => account.id)
        .map((account) => account.id)

      navigate('/contentPlanner', { state: { accountsId: createdAccountIds } })
    } catch (error) {
      console.error(
        'Error fetching data:',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  return (
    <li>
      <button
        onClick={handleContentPlannerClick}
        className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2 transition-colors duration-200 ${
          isDarkMode
            ? 'text-gray-300 hover:bg-gray-800 hover:text-orange-500'
            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
        }`}
        aria-label={label}
      >
        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {icon}
        </span>
        <span>{label}</span>
      </button>
    </li>
  )
} */

/**
 * Standard sidebar navigation item
 */
const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  icon,
  label,
  isDarkMode,
}) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors duration-200 ${
          isActive
            ? `${
                isDarkMode
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-500 text-white'
              }`
            : `${
                isDarkMode
                  ? 'text-gray-300 hover:bg-gray-800 hover:text-orange-500'
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
              }`
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`${
              isActive
                ? 'text-white'
                : isDarkMode
                  ? 'text-gray-400'
                  : 'text-gray-500'
            }`}
          >
            {icon}
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  </li>
)

export default Sidebar
