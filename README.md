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
