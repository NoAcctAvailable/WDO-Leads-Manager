import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Properties from './pages/Properties'
import Leads from './pages/Leads'
import Inspections from './pages/Inspections'
import Users from './pages/Users'
import Profile from './pages/Profile'
import LoadingSpinner from './components/LoadingSpinner'
import FirstLoginDialog from './components/FirstLoginDialog'

const App: React.FC = () => {
  const { user, loading, updateProfile } = useAuth()
  const [showFirstLogin, setShowFirstLogin] = useState(false)

  // Show first login dialog if user needs to change password
  React.useEffect(() => {
    if (user && user.isFirstLogin) {
      setShowFirstLogin(true)
    }
  }, [user])

  const handleFirstLoginComplete = async (updatedUser: any) => {
    try {
      await updateProfile(updatedUser)
      setShowFirstLogin(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/inspections" element={<Inspections />} />
          <Route path="/profile" element={<Profile />} />
          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <Route path="/users" element={<Users />} />
          )}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>

      <FirstLoginDialog
        open={showFirstLogin}
        currentUser={user}
        onComplete={handleFirstLoginComplete}
      />
    </>
  )
}

export default App 