import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/campaigns';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all campaign categories
export const getCategories = async () => {
  const response = await axios.get(`${API_BASE_URL}/categories`);
  return response.data;
};

// Get all campaigns (public, with optional filters)
export const getAllCampaigns = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  const response = await axios.get(`${API_BASE_URL}?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Get a single campaign by ID
export const getCampaignById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Get current user's campaigns
export const getMyCampaigns = async () => {
  const response = await axios.get(`${API_BASE_URL}/my`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Create a new campaign (as draft)
export const createCampaign = async (campaignData) => {
  const response = await axios.post(API_BASE_URL, campaignData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Update an existing campaign
export const updateCampaign = async (id, campaignData) => {
  const response = await axios.put(`${API_BASE_URL}/${id}`, campaignData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Submit campaign for approval
export const submitCampaign = async (id) => {
  const response = await axios.put(`${API_BASE_URL}/${id}/submit`, {}, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Delete a draft campaign
export const deleteCampaign = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Request campaign cancellation
export const requestCancellation = async (id, reason) => {
  const response = await axios.put(`${API_BASE_URL}/${id}/cancel`, { reason }, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Upload media to a campaign
export const uploadCampaignMedia = async (campaignId, file, type = 'image') => {
  const formData = new FormData();
  formData.append('media', file);

  const response = await axios.post(`${API_BASE_URL}/${campaignId}/media`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Upload multiple images to a campaign
export const uploadCampaignImages = async (campaignId, files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  const response = await axios.post(`${API_BASE_URL}/${campaignId}/images`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Save campaign as draft (create or update)
export const saveDraft = async (campaignData, existingId = null) => {
  if (existingId) {
    return updateCampaign(existingId, campaignData);
  }
  return createCampaign(campaignData);
};

export default {
  getCategories,
  getAllCampaigns,
  getCampaignById,
  getMyCampaigns,
  createCampaign,
  updateCampaign,
  submitCampaign,
  deleteCampaign,
  requestCancellation,
  uploadCampaignMedia,
  uploadCampaignImages,
  saveDraft
};
