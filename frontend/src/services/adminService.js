import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/admin';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get admin dashboard stats
export const getAdminStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/stats`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Get all pending campaigns for review
export const getPendingCampaigns = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.sort) queryParams.append('sort', params.sort);

  const response = await axios.get(
    `${API_BASE_URL}/campaigns/pending?${queryParams.toString()}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Get full campaign details for review
export const getCampaignForReview = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/campaigns/${id}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Approve a campaign
export const approveCampaign = async (id, adminNotes = '') => {
  const response = await axios.put(
    `${API_BASE_URL}/campaigns/${id}/approve`,
    { adminNotes },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Reject a campaign
export const rejectCampaign = async (id, reason, customMessage = '') => {
  const response = await axios.put(
    `${API_BASE_URL}/campaigns/${id}/reject`,
    { reason, customMessage },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Bulk approve multiple campaigns
export const bulkApproveCampaigns = async (campaignIds) => {
  const response = await axios.post(
    `${API_BASE_URL}/campaigns/bulk-approve`,
    { campaignIds },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Get rejection reasons list
export const getRejectionReasons = async () => {
  const response = await axios.get(`${API_BASE_URL}/rejection-reasons`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Get edit requests
export const getEditRequests = async () => {
  const response = await axios.get(`${API_BASE_URL}/campaigns/edit-requests`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Approve edit request
export const approveEditRequest = async (id) => {
  const response = await axios.put(
    `${API_BASE_URL}/campaigns/${id}/approve-edit`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Reject edit request
export const rejectEditRequest = async (id, reason) => {
  const response = await axios.put(
    `${API_BASE_URL}/campaigns/${id}/reject-edit`,
    { reason },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// ========================================
// Admin Fund Release Calls
// ========================================

// Get campaigns eligible for non-milestone payouts
export const getEligiblePayouts = async () => {
  const response = await axios.get(`${API_BASE_URL}/fund-releases/eligible`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Release funds for non-milestone campaigns or force-release milestone campaigns
export const releaseCampaignFunds = async (campaignId, overrideMilestone = false, amount = null) => {
  const payload = { overrideMilestone };
  if (amount) payload.amount = amount;

  const response = await axios.post(`${API_BASE_URL}/fund-releases/campaign/${campaignId}`, 
    payload, 
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Initiate payment gateway for disbursement
export const initiateDisbursementPayment = async (releaseId, paymentMethod) => {
  const response = await axios.post(`${API_BASE_URL}/fund-releases/${releaseId}/initiate-payment`, 
    { paymentMethod }, 
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Rollback a pending/failed fund release
export const rollbackDisbursement = async (releaseId) => {
  const response = await axios.post(`${API_BASE_URL}/fund-releases/${releaseId}/rollback`, 
    {}, 
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export default {
  getAdminStats,
  getPendingCampaigns,
  getCampaignForReview,
  approveCampaign,
  rejectCampaign,
  bulkApproveCampaigns,
  getRejectionReasons,
  getEditRequests,
  approveEditRequest,
  rejectEditRequest,
  getEligiblePayouts,
  releaseCampaignFunds,
  initiateDisbursementPayment,
  rollbackDisbursement
};
