import { useState } from 'react'
import './app.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './components/pages/auth/auth'
import RegisterPage from './components/pages/register/register'
import ReferentSearch from './components/pages/referent-search/referent-search'
import PrivateRoute from './components/shared/privateRoute'
import { Menu, Moon, Sun, X } from 'lucide-react'
import Sidebar from './components/shared/sidebar/sidebar'
import UserAccount from './components/pages/user-account/user-account'
import ContentPlanner from './components/pages/content-planner/content-planner'
import KnowledgeBaseForm from './components/pages/knowledge-base/knowledge-base-form/knowledge-base-form'
import KnowledgeBaseView from './components/pages/knowledge-base/knowledge-base-view/knoledge-base-view'
import ApproveContentPlanner from './components/pages/content-planner/approve-content-planner'
import Tutorial from './components/shared/tutorial/Tutorial'
import { AuthProvider, ThemeProvider, useAuth, useTheme } from './context'

function AppContent() {
  const { isAuthenticated, loading, businessName, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [showTutorial, setShowTutorial] = useState<boolean>(false)

  const handleLogin = async (): Promise<void> => {
    // Esta función ahora solo notifica que el login fue exitoso
    // La lógica real está en los componentes de auth que llaman a useAuth().login()
  }

  const handleLogout = (): void => {
    logout()
  }

  const toggleSidebar = (): void => {
    if (showTutorial) {
      return;
    }
    setIsSidebarOpen(!isSidebarOpen);
  }

  const handleTutorialRestart = () => {
    localStorage.removeItem('hasSeenTutorial');
    setIsSidebarOpen(true);
    setShowTutorial(false);
    setTimeout(() => {
      setShowTutorial(true);
    }, 100);
  };

  const handleTutorialEnd = () => {
    setShowTutorial(false);
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <BrowserRouter>
      <div
        className={`flex h-auto w-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}
      >
        {isAuthenticated && (
          <>
            <Sidebar isDarkMode={isDarkMode} isOpen={isSidebarOpen} />
            <Tutorial 
              isDarkMode={isDarkMode} 
              onOpenSidebar={() => setIsSidebarOpen(true)}
              shouldStart={showTutorial}
              onEnd={handleTutorialEnd}
            />
          </>
        )}

        <div
          className={`flex-1 transition-all duration-300 h-auto w-full ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
        >
          {isAuthenticated && (
            <header
              className={`flex items-center justify-between p-6 text-white ${isDarkMode ? 'bg-gray-800/80' : 'bg-orange-600'}`}
            >
              <div className="flex items-center">
                <button
                  onClick={toggleSidebar}
                  className={`${isDarkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-orange-600 hover:bg-orange-700'} mr-4 rounded-full p-2 text-white shadow-lg`}
                  aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
                  disabled={showTutorial}
                >
                  {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <h1 className="text-3xl font-bold">{businessName}</h1>
              </div>

              <div className="flex">
                <button
                  onClick={toggleTheme}
                  className={`${isDarkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-orange-600 hover:bg-orange-700'} flex items-center rounded-lg px-4 py-2 text-white`}
                  aria-label="Cambiar tema"
                >
                  {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                </button>
                <button
                  onClick={handleTutorialRestart}
                  className={`${isDarkMode ? 'bg-gray-800/80 hover:bg-gray-800' : 'bg-orange-600 hover:bg-orange-700'} ml-4 flex items-center rounded-lg px-4 py-2 text-white`}
                >
                  <span className="mr-2">📚</span>
                  Tutorial
                </button>
                <button
                  onClick={handleLogout}
                  className={`${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} ml-4 rounded-lg px-4 py-2 text-white`}
                >
                  Cerrar sesión
                </button>
              </div>
            </header>
          )}

          <main className="p-6">
            <Routes>
              <Route
                path="/"
                element={
                  !isAuthenticated ? (
                    <LoginPage
                      isDarkMode={isDarkMode}
                      onLogin={handleLogin}
                      isAuthenticated={isAuthenticated}
                    />
                  ) : (
                    <ReferentSearch isDarkMode={isDarkMode} />
                  )
                }
              />
              <Route
                path="/register"
                element={<RegisterPage isDarkMode={isDarkMode} />}
              />
              <Route
                path="/referentSearch"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <ReferentSearch isDarkMode={isDarkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/userAccount"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <UserAccount isDarkMode={isDarkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/contentPlanner"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <ContentPlanner isDarkMode={isDarkMode} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/knowledgeBaseForm"
                element={
                  <KnowledgeBaseForm />
                } 
              />
              <Route
                path="/knowledgeBaseView"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                  <KnowledgeBaseView isDarkMode={isDarkMode} />
                  </PrivateRoute>
                } 
              />
              <Route
                path="/approveContentPlanner"
                element={
                  <PrivateRoute isAuthenticated={isAuthenticated}>
                    <ApproveContentPlanner isDarkMode={isDarkMode} />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

// Componente principal con los providers
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
