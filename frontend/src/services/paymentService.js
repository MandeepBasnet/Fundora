import api from './api';

const paymentService = {
  // Initialize Payment (returns form data for eSewa or URL for Khalti)
  initiatePayment: async (data) => {
    // data: { campaignId, amount, paymentMethod }
    const response = await api.post('/payment/initiate', data);
    return response.data;
  },

  // Verify eSewa Payment
  verifyEsewa: async (data) => {
    // data: Base64 string from query param
    const response = await api.get(`/payment/verify-esewa?data=${data}`);
    return response.data;
  },

  // Verify Khalti Payment
  verifyKhalti: async (pidx) => {
    const response = await api.post('/payment/verify-khalti', { pidx });
    return response.data;
  },

  // Get Transaction History
  getTransactionHistory: async () => {
    const response = await api.get('/payment/history');
    return response.data;
  },

  // Redeem Reward
  redeemReward: async (transactionId) => {
    const response = await api.put(`/payment/transactions/${transactionId}/redeem`);
    return response.data;
  },

  // Get Creator Finances Overview
  getCreatorFinances: async () => {
    const response = await api.get('/finances/overview');
    return response.data;
  },

  // Get Creator Payouts
  getCreatorPayouts: async () => {
    const response = await api.get('/finances/payouts');
    return response.data;
  }
};

export default paymentService;
