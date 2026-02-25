import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { ForgotPassword } from './pages/auth/ForgotPasswordPage'
import { OTPVerificationPage } from './pages/auth/OTPVerificationPage'
import { ResetPasswordOTPPage } from './pages/auth/ResetPasswordOTPPage'
import { NewPasswordPage } from './pages/auth/NewPasswordPage'
import { BrowseCampaigns } from './pages/campaigns/BrowseCampaigns'
import { CampaignDetail } from './pages/CampaignDetail'
import { AuthProvider } from './context/AuthContext'

import { StartCampaign } from './pages/campaigns/StartCampaign'

// Backer pages
import { BackerDashboard } from './pages/backer/BackerDashboard'
import { SupportedProjects } from './pages/backer/SupportedProjects'

// Creator pages
import { Overview } from './pages/creator/Overview'
import { MyCampaigns } from './pages/creator/MyCampaigns'
import { Finances } from './pages/creator/Finances'
import { MilestoneSubmission } from './pages/creator/MilestoneSubmission'

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { CampaignQueue } from './pages/admin/CampaignQueue'
import { UserManagement } from './pages/admin/UserManagement'
import { Moderation } from './pages/admin/Moderation'
import { PlatformSettings } from './pages/admin/PlatformSettings'
import FinancialReports from './pages/admin/FinancialReports'
import FundDisbursements from './pages/admin/FundDisbursements'
import DisbursementGatewayHandler from './pages/admin/DisbursementGatewayHandler'
import { MilestoneReview } from './pages/admin/MilestoneReview'

// Shared pages
import { Messages } from './pages/shared/Messages'
import { Transactions } from './pages/shared/Transactions'
import { Profile } from './pages/shared/Profile'
import { Forbidden403 } from './pages/shared/Forbidden403'

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout'
import { CreatorLayout } from './layouts/CreatorLayout'
import { AdminLayout } from './layouts/AdminLayout'

// Payment Pages
import PaymentSelection from './pages/payment/PaymentSelection';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentFailure from './pages/payment/PaymentFailure';

// Auth
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/reset-password-otp" element={<ResetPasswordOTPPage />} />
          <Route path="/new-password" element={<NewPasswordPage />} />
          <Route path="/campaigns" element={<BrowseCampaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/403" element={<Forbidden403 />} />
          
          {/* Admin Routes - Admin only */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="campaigns" element={<CampaignQueue />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="moderation" element={<Moderation />} />
              <Route path="financial-reports" element={<FinancialReports />} />
              <Route path="fund-disbursements" element={<FundDisbursements />} />
              <Route path="fund-disbursements/verify-esewa/:releaseId" element={<DisbursementGatewayHandler gateway="esewa" />} />
              <Route path="fund-disbursements/verify-khalti/:releaseId" element={<DisbursementGatewayHandler gateway="khalti" />} />
              <Route path="milestone-review" element={<MilestoneReview />} />
              <Route path="settings" element={<PlatformSettings />} />
            </Route>
          </Route>

          {/* Backer Routes - Backer and Creator can access */}
          <Route element={<ProtectedRoute allowedRoles={['backer', 'creator']} />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<BackerDashboard />} />
              <Route path="supported" element={<SupportedProjects />} />
              <Route path="messages" element={<Messages />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
          
          {/* Creator Routes - Creator only */}
          <Route element={<ProtectedRoute allowedRoles={['creator']} />}>
            <Route path="/creator" element={<CreatorLayout />}>
              <Route index element={<Overview />} />
              <Route path="campaigns" element={<MyCampaigns />} />
              <Route path="milestones" element={<MilestoneSubmission />} />
              <Route path="finances" element={<Finances />} />
              <Route path="messages" element={<Messages />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            {/* Standalone Creator Routes */}
            <Route path="/start-campaign" element={<StartCampaign />} />
            <Route path="/edit-campaign/:campaignId" element={<StartCampaign />} />
          </Route>
          
          {/* Standalone Shared Routes - Any authenticated user */}
          <Route element={<ProtectedRoute allowedRoles={['backer', 'creator']} />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/payment/select" element={<PaymentSelection />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
