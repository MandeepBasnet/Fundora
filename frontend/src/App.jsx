import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ForgotPassword } from './pages/auth/ForgotPasswordPage'
import { BrowseCampaigns } from './pages/campaigns/BrowseCampaigns'
import { CampaignDetail } from './pages/CampaignDetail'
import { AuthProvider } from './context/AuthContext'

import { BackerDashboard } from './pages/dashboard/BackerDashboard'
import { SupportedProjects } from './pages/dashboard/SupportedProjects'
import { Messages } from './pages/shared/Messages'
import { Transactions } from './pages/shared/Transactions'
import { Profile } from './pages/shared/Profile'
import { DashboardLayout } from './components/layouts/DashboardLayout'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/campaigns" element={<BrowseCampaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          
          {/* Dashboard Routes with Layout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<BackerDashboard />} />
            <Route path="supported" element={<SupportedProjects />} />
            <Route path="messages" element={<Messages />} />
            <Route path="transactions" element={<Transactions />} />
          </Route>
          
          {/* Shared Routes */}
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
