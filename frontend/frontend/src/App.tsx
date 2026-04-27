import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import SupervisorDashboard from './pages/SupervisorDashboard'
import { useTheme } from './hooks/useTheme'
import { useAuthStore } from './store/authStore'
import AdminDashboard from './pages/AdminDashboard'

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

function App() {
  useTheme()
  const { token, role } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/student" element={
          <PrivateRoute><StudentDashboard /></PrivateRoute>
        } />
        <Route path="/supervisor" element={
          <PrivateRoute><SupervisorDashboard /></PrivateRoute>
        } />
        <Route path="/" element={
          token
            ? role === 'ETUDIANT'
              ? <Navigate to="/student" />
              : role === 'ENCADRANT'
              ? <Navigate to="/supervisor" />
              : <Navigate to="/admin" />
            : <Navigate to="/login" />
        } />
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />

      </Routes>
    </BrowserRouter>
  )
}

export default App