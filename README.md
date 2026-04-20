# Fundora

A crowdfunding platform connecting innovative projects with backers in Nepal.

## Feature Implementation Status

### ✅ Completed Features
These features are fully implemented with both frontend and backend logic.

**1. User Authentication & Management**
- User Registration & Login (JWT, Cookies)
- Role-Based Access Control (Admin, Creator, Backer)
- Password Management (Forgot/Reset Password, Change Password)
- Profile Management (Update Details, Avatar)

**2. Campaign Management**
- create Campaign Wizard (5-step process)
- Edit & Delete Campaigns
- Media Upload (Images, Videos to Cloudinary)
- Reward Tier Management
- Milestone Definition

**3. Campaign Discovery**
- Browse Campaigns (Grid View)
- Advanced Search & Filtering (Category, Funding Type)
- Sorting & Pagination (including Trending Logic)
  - The trendingScore automatically increments based on interactions:
  - +10 points when a user backs a campaign for the first time.
  - +5 points for repeat transactions by the same user.
  - +5 points when the creator posts a Campaign Update.
  - +2 points when a user posts a Comment.
- Detailed Campaign View (Story, Rewards, Updates, Comments)

**4. Payments**
- eSewa Integration (Sandbox)
- Khalti Integration (Sandbox)
- Transaction History
- Real-time Fund Updates

**5. Admin Panel**
- Admin Dashboard (Stats & Overview)
- Campaign Approval Queue (Approve/Reject with email notifications)
- User Management (View & Filter Users)

**6. Engagement**
- Post Comments on Campaigns
- Post Campaign Updates (Creators)

**7. Milestone System**
- **Milestone Submission:** Frontend modal exists, but submission logic is missing.
- **Fund Release:** No backend logic to calculate or release funds based on milestones.
- **Proof Upload:** Missing implementation.


**8. Safety & Moderation**
- **Flagging:** Users can flag campaigns with reason and evidence uploads.
- **Moderation Action:** Admin can uphold (Warn, Suspend, Terminate) or dismiss flags.
- **False Flag Penalization:**
  - If an Admin dismisses a flagged report and marks it as *Malicious/Spam*, the reporting user receives a penalty strike (`falseFlagCount` increases by 1).
  - A user can incur up to 2 penalty strikes without immediate consequence.
  - Upon receiving their **3rd penalty strike**, the system automatically restricts their account from submitting any further flags for exactly **30 days**.
- **Admin Stats:** Moderation API exposes user false flag count tables and campaign high-risk tables.

### ⚠️ Partially Implemented / Frontend Only
These features have frontend UI components (pages, modals, or mockups) but lack backend logic or full integration.



**9. Communication (Mockups)**
- **Real-Time Messaging:** `Messages.jsx` exists but uses mock data. No real-time backend.
- **Notifications:** `NotificationDropdown.jsx` exists but uses mock data.

**10. Admin Settings**
- **Platform Settings:** Page exists, but settings are not saved to backend.


---

## Payment Integration Testing

Use the following credentials to test payment gateways in the Sandbox environment.

### eSewa Sandbox
- **Mobile/ID:** `9806800001`
- **Password:** `Nepal@123`
- **MPIN:** `1122`
- **Token:** `123456`

### Khalti Sandbox
- **Test Mobile Numbers:**
  - `9800000001`
  - `9800000002`
  - `9800000003`
  - `9800000004`
  - `9800000005`
- **MPIN:** `1111`
- **OTP:** `987654`

> **Note:** If `9800000001` shows "Insufficient Balance", please try the other numbers (02-05) or create a new test user in your [Khalti Sandbox Dashboard](https://sandbox.admin.khalti.com/).

---

## Testing Guide

The complete details for execution, reporting, and isolated test runs are available in the [Backend Execution & Documentation Guide](./backend/EXECUTION%20&%20DOCUMENTATION%20GUIDE.md). Below is a quick start regarding testing.

### Running All Tests
To run the full suite of integration tests (auth, campaigns, flagging, payments, milestones):
```bash
cd backend
npm run test
```

To show verbose test outputs (e.g. for API response bodies logging):
```bash
npm run test -- --verbose
```

### Running Tests for a Specific Sprint / File
You can run individual test files for isolating sprint-specific features:
```bash
npm run test -- tests/auth.test.js --verbose
npm run test -- tests/campaign.test.js --verbose
npm run test -- tests/payment.test.js --verbose
npm run test -- tests/milestone.test.js --verbose
npm run test -- tests/flagging.test.js --verbose
```

### Test Coverage
To generate a comprehensive test coverage report:
```bash
npm run test:coverage
```
*The report will be available in the `backend/coverage` directory.*

---

## Setup and Installation Guide

### Prerequisites
Make sure you have installed on your local machine:
- Node.js (v18 or higher recommended)
- MongoDB (running locally, or a MongoDB Atlas URI)

### Required Packages
This project is built using the MERN stack with modern libraries.

**Backend Dependencies:**
- `express`: Web framework
- `mongoose`: MongoDB object modeling
- `bcryptjs`: Password hashing
- `jsonwebtoken`: Authentication
- `cloudinary`, `multer`, `multer-storage-cloudinary`: File and media uploads
- `cors`, `dotenv`: Environment and security configuration
- `nodemailer`: Email notifications
- `socket.io`: Real-time communication
- `jest`, `supertest`: Testing framework and HTTP assertions (dev dependencies)

**Frontend Dependencies:**
- `react`, `react-dom`: UI library
- `react-router-dom`: Routing
- `axios`: HTTP client
- `tailwindcss`, `lucide-react`, `clsx`, `tailwind-merge`: Styling and icons
- `recharts`: Data visualization
- `socket.io-client`: Real-time frontend client

### Setup Instructions

**1. Clone the repository**
```bash
git clone <repository_url>
cd Fundora
```

**2. Backend Setup**
Navigate to the backend directory and install packages:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with these variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5173

JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Fundora <your_email@gmail.com>

# OTP Configuration
OTP_EXPIRY_MINUTES=10

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateway Configuration
# eSewa (Test)
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET_KEY=your_esewa_secret
ESEWA_SUCCESS_URL=http://localhost:5173/payment/success
ESEWA_FAILURE_URL=http://localhost:5173/payment/failure

# Khalti (Test)
KHALTI_SECRET_KEY=your_khalti_secret
KHALTI_INITIATE_URL=https://a.khalti.com/api/v2/epayment/initiate/
KHALTI_LOOKUP_URL=https://a.khalti.com/api/v2/epayment/lookup/
KHALTI_RETURN_URL=http://localhost:5173/payment/success
```

Start the backend server in development mode:
```bash
npm run dev
```

**3. Frontend Setup**
Navigate to the frontend directory and install packages:
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```
