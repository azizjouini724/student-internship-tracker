import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import SupervisorDashboard from './pages/SupervisorDashboard'
import SupervisorDeadlinesPage from './pages/SupervisorDeadlinesPage'
import SupervisorStudentsPage from './pages/Supervisorstudentspage'
import SupervisorReportsPage from './pages/Supervisorreportspage'
import { useTheme } from './hooks/useTheme'
import { useAuthStore } from './store/authStore'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsersPage from './pages/Adminuserspage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import ProfilePage from './pages/ProfilePage'
import ReportsPage from './pages/Reportspage'
import SettingsPage from './pages/SettingsPage'
import SupportPage from './pages/Supportpage'
import NotificationsPage from './pages/NotificationsPage'
import MessagesPage from './pages/MessagesPage'

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { token } = useAuthStore()
  
  // ✅ FIX : Si pas de token, redirect avec replace=true pour vider l'historique
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  useTheme()
  const { token, role } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Redirect racine selon le rôle */}
        <Route path="/" element={
          token
            ? role === 'ETUDIANT'
              ? <Navigate to="/student" />
              : role === 'ENCADRANT'
              ? <Navigate to="/supervisor" />
              : <Navigate to="/admin" />
            : <Navigate to="/login" />
        } />

        {/* Étudiant */}
        <Route path="/student"  element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
        <Route path="/reports"  element={<PrivateRoute><ReportsPage /></PrivateRoute>} />

        {/* Encadrant */}
        <Route path="/supervisor"           element={<PrivateRoute><SupervisorDashboard /></PrivateRoute>} />
        <Route path="/supervisor/deadlines" element={<PrivateRoute><SupervisorDeadlinesPage /></PrivateRoute>} />
        <Route path="/supervisor/students"  element={<PrivateRoute><SupervisorStudentsPage /></PrivateRoute>} />
        <Route path="/supervisor/reports"   element={<PrivateRoute><SupervisorReportsPage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin"                element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users"          element={<PrivateRoute><AdminUsersPage /></PrivateRoute>} />
        <Route path="/admin/analytics"      element={<PrivateRoute><AdminAnalyticsPage /></PrivateRoute>} />
        <Route path="/admin/notifications"  element={<PrivateRoute><NotificationsPage /></PrivateRoute>} /> {/* ✅ AJOUTÉ */}
               

        {/* Partagées */}
        <Route path="/profile"       element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/settings"      element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/support"       element={<PrivateRoute><SupportPage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />

      </Routes>
    </BrowserRouter>
  )
}

export default App