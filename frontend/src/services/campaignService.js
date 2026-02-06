import api from './api';

const CAMPAIGNS_URL = '/campaigns';

// Get all campaign categories
export const getCategories = async () => {
  const response = await api.get(`${CAMPAIGNS_URL}/categories`);
  return response.data;
};

// Get all campaigns (public, with optional filters)
export const getAllCampaigns = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  
  const response = await api.get(`${CAMPAIGNS_URL}?${params.toString()}`);
  return response.data;
};

// Get a single campaign by ID
export const getCampaignById = async (id) => {
  const response = await api.get(`${CAMPAIGNS_URL}/${id}`);
  return response.data;
};

// Get current user's campaigns
export const getMyCampaigns = async () => {
  const response = await api.get(`${CAMPAIGNS_URL}/my`);
  return response.data;
};

// Get campaigns supported by current user
export const getSupportedCampaigns = async () => {
    const response = await api.get(`${CAMPAIGNS_URL}/supported`);
    return response.data;
};

// Create a new campaign (as draft)
export const createCampaign = async (campaignData) => {
  const response = await api.post(CAMPAIGNS_URL, campaignData);
  return response.data;
};

// Update an existing campaign
export const updateCampaign = async (id, campaignData) => {
  const response = await api.put(`${CAMPAIGNS_URL}/${id}`, campaignData);
  return response.data;
};

// Submit campaign for approval
export const submitCampaign = async (id) => {
  const response = await api.put(`${CAMPAIGNS_URL}/${id}/submit`);
  return response.data;
};

// Delete a draft campaign
export const deleteCampaign = async (id) => {
  const response = await api.delete(`${CAMPAIGNS_URL}/${id}`);
  return response.data;
};

// Request campaign cancellation
export const requestCancellation = async (id, reason) => {
  const response = await api.put(`${CAMPAIGNS_URL}/${id}/cancel`, { reason });
  return response.data;
};

// Upload media to a campaign
export const uploadCampaignMedia = async (campaignId, file, type = 'image') => {
  const formData = new FormData();
  formData.append('media', file);

  const response = await api.post(`${CAMPAIGNS_URL}/${campaignId}/media`, formData, {
    headers: {
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

  const response = await api.post(`${CAMPAIGNS_URL}/${campaignId}/images`, formData, {
    headers: {
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

// Comment methods
export const getComments = async (campaignId) => {
  const response = await api.get(`${CAMPAIGNS_URL}/${campaignId}/comments`);
  return response.data;
};

export const addComment = async (campaignId, content, parentComment = null) => {
  const response = await api.post(`${CAMPAIGNS_URL}/${campaignId}/comments`, { content, parentComment });
  return response.data;
};

export const editComment = async (commentId, content) => {
  const response = await api.put(`${CAMPAIGNS_URL}/comments/${commentId}`, { content });
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await api.delete(`${CAMPAIGNS_URL}/comments/${commentId}`);
  return response.data;
};

// Campaign Update methods
export const getUpdates = async (campaignId) => {
  const response = await api.get(`${CAMPAIGNS_URL}/${campaignId}/updates`);
  return response.data;
};

export const createUpdate = async (campaignId, data) => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  
  if (data.images) {
    data.images.forEach(image => formData.append('images', image));
  }
  if (data.video) {
    formData.append('video', data.video);
  }

  const response = await api.post(`${CAMPAIGNS_URL}/${campaignId}/updates`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export default {
  getCategories,
  getAllCampaigns,
  getCampaignById,
  getCampaignById,
  getMyCampaigns,
  getSupportedCampaigns,
  createCampaign,
  updateCampaign,
  submitCampaign,
  deleteCampaign,
  requestCancellation,
  uploadCampaignMedia,
  uploadCampaignImages,
  saveDraft,
  getComments,
  addComment,
  editComment,
  deleteComment,
  getUpdates,
  createUpdate
};
