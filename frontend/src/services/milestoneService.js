import api from './api';

// ========================================
// Creator-facing Milestone API calls
// ========================================

// Get milestones for a campaign
export const getCampaignMilestones = async (campaignId) => {
  const response = await api.get(`/campaigns/${campaignId}/milestones`);
  return response.data;
};

// Get single milestone detail
export const getMilestoneDetail = async (campaignId, milestoneId) => {
  const response = await api.get(`/campaigns/${campaignId}/milestones/${milestoneId}`);
  return response.data;
};

// Submit milestone proof (creator)
export const submitMilestoneProof = async (campaignId, milestoneId, data) => {
  const response = await api.put(
    `/campaigns/${campaignId}/milestones/${milestoneId}/submit`,
    data
  );
  return response.data;
};

// Get fund release history for a campaign
export const getFundReleaseHistory = async (campaignId) => {
  const response = await api.get(`/campaigns/${campaignId}/fund-releases`);
  return response.data;
};

// ========================================
// Admin-facing Milestone Review API calls
// ========================================

// Get all pending milestone submissions
export const getPendingMilestones = async () => {
  const response = await api.get('/admin/milestones/pending');
  return response.data;
};

// Get milestone details for admin review
export const getMilestoneForReview = async (campaignId, milestoneId) => {
  const response = await api.get(`/admin/milestones/${campaignId}/${milestoneId}`);
  return response.data;
};

// Approve a milestone
export const approveMilestone = async (campaignId, milestoneId) => {
  const response = await api.put(`/admin/milestones/${campaignId}/${milestoneId}/approve`);
  return response.data;
};

// Reject a milestone
export const rejectMilestone = async (campaignId, milestoneId, data) => {
  const response = await api.put(
    `/admin/milestones/${campaignId}/${milestoneId}/reject`,
    data
  );
  return response.data;
};

// Request milestone resubmission
export const requestMilestoneResubmission = async (campaignId, milestoneId, data) => {
  const response = await api.put(
    `/admin/milestones/${campaignId}/${milestoneId}/resubmit`,
    data
  );
  return response.data;
};

// ========================================
// Admin Fund Release Management
// ========================================

// Get all fund releases (admin)
export const getAllFundReleases = async (params = {}) => {
  const response = await api.get('/admin/fund-releases', { params });
  return response.data;
};

// Update fund release disbursement status (admin)
export const updateDisbursementStatus = async (releaseId, data) => {
  const response = await api.put(`/admin/fund-releases/${releaseId}/status`, data);
  return response.data;
};
