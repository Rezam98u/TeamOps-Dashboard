import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import ProjectsPage from './pages/ProjectsPage'
import KpisPage from './pages/KpisPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/employees"
            element={
              <RequireAuth>
                <EmployeesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/projects"
            element={
              <RequireAuth>
                <ProjectsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/kpis"
            element={
              <RequireAuth>
                <KpisPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
