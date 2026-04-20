/**
 * Fundora - Payment Processing Tests (eSewa & Khalti)
 * Covers:
 * - Payment Initialization (eSewa, Khalti, invalid method)
 * - Minimum amount boundary (NPR 9 vs NPR 10)
 * - Creator restriction (creators cannot back)
 * - Khalti: mock fetch interceptor (pidx returned)
 * - Khalti Verification: valid pidx, fake/non-existent pidx, non-Completed status
 * - eSewa Verification: valid base64 payload, tampered data, non-COMPLETE status, missing data
 * - Idempotency: double-verifying same transaction
 * - Payment Failure Handler
 * - Reward Redemption: happy path, pending transaction rejection
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Transaction = require('../models/Transaction');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');

// Mock email service
jest.mock('../utils/emailService', () => ({
  generateOTP: jest.fn(() => '123456'),
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendReceiptEmail: jest.fn().mockResolvedValue(true),
}));

// Lifecycle
beforeAll(async () => {
  await connectTestDB();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_fundora';
  process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || 'test_refresh_secret_fundora';
  process.env.OTP_EXPIRY_MINUTES = '10';
  process.env.ESEWA_SECRET_KEY = 'test_esewa_secret';
  process.env.ESEWA_PRODUCT_CODE = 'EPAYTEST';
  process.env.ESEWA_SUCCESS_URL = 'http://localhost:5173/payment/esewa/success';
  process.env.ESEWA_FAILURE_URL = 'http://localhost:5173/payment/esewa/failure';
  process.env.KHALTI_INITIATE_URL = 'https://a.khalti.com/api/v2/epayment/initiate/';
  process.env.KHALTI_LOOKUP_URL = 'https://a.khalti.com/api/v2/epayment/lookup/';
  process.env.KHALTI_SECRET_KEY = 'test_khalti_secret';
  process.env.KHALTI_RETURN_URL = 'http://localhost:5173/payment/khalti/callback';
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  jest.clearAllMocks();
  // Restore fetch to avoid leakage between tests
  if (global.fetch && global.fetch.mockRestore) {
    global.fetch.mockRestore();
  }
});

// HELPERS
const createAndLoginUser = async ({
  name = 'Test User',
  email = 'user@fundora.com',
  password = 'Password123!',
  role = 'backer',
} = {}) => {
  await request(app).post('/api/auth/register').send({ name, email, password, role });
  const dbUser = await User.findOne({ email });
  await request(app).post('/api/otp/verify').send({ email, otp: dbUser.otp.code });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return { token: loginRes.body.token, userId: loginRes.body._id };
};

const createActiveTestCampaign = async (creatorId) => {
  return Campaign.create({
    creator: creatorId,
    title: 'Test Campaign For Payment',
    description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.',
    shortDescription: 'Payment test.',
    category: 'Technology',
    fundingGoal: 500000,
    duration: 30,
    fundingType: 'donation-based',
    images: [{ url: 'http://cdn.com/img.jpg', publicId: 'pub_id' }],
    status: 'active',
  });
};

/**
 * Build a base64-encoded eSewa payload as the real gateway would send.
 */
const buildEsewaPayload = (overrides = {}) => {
  const payload = {
    transaction_code: 'TXN-ESEWA-001',
    status: 'COMPLETE',
    total_amount: '1000',
    transaction_uuid: 'test-txn-uuid',
    product_code: process.env.ESEWA_PRODUCT_CODE,
    signed_field_names: 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names',
    signature: 'fake_valid_signature',
    ...overrides,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

// 1. PAYMENT INITIALIZATION - eSewa
describe('POST /api/payment/initiate - Initialize Payment', () => {
  let backerToken;
  let activeCampaignId;
  let creatorUserId;

  beforeEach(async () => {
    const { token: bToken } = await createAndLoginUser({ role: 'backer', email: 'backer@fundora.com', name: 'Backer' });
    backerToken = bToken;
    const { userId: cId } = await createAndLoginUser({
      role: 'creator',
      email: 'creator@fundora.com',
      name: 'Creator',
    });
    creatorUserId = cId;
    const dbCreator = await User.findOne({ email: 'creator@fundora.com' });
    const campaign = await createActiveTestCampaign(dbCreator._id);
    activeCampaignId = campaign._id.toString();
  });

  // eSewa Happy Path
  it('[HAPPY] should initialize eSewa payment and return form data', async () => {
    const res = await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ campaignId: activeCampaignId, amount: 500, paymentMethod: 'esewa' });

    expect(res.statusCode).toBe(200);
    expect(res.body.paymentMethod).toBe('esewa');
    expect(res.body.formData).toBeDefined();
    expect(res.body.formData).toHaveProperty('signature');
    expect(res.body.formData).toHaveProperty('transaction_uuid');
    expect(res.body.formData.total_amount).toBe(500);
    expect(res.body.formUrl).toContain('esewa');
  });

  it('[HAPPY] should create a pending transaction in DB on init', async () => {
    await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ campaignId: activeCampaignId, amount: 500, paymentMethod: 'esewa' });

    const txn = await Transaction.findOne({ campaign: activeCampaignId, status: 'pending' });

    expect(txn).not.toBeNull();
    expect(txn.gateway).toBe('esewa');
    expect(txn.amount).toBe(500);
  });

  // Khalti Happy Path (fetch mocked)
  it('[HAPPY] should initialize Khalti payment and return paymentUrl + pidx', async () => {
    const mockPidx = 'fake-pidx-abc123';
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        pidx: mockPidx,
        payment_url: 'https://test-pay.khalti.com/?pidx=fake-pidx-abc123',
      }),
    });

    const res = await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ campaignId: activeCampaignId, amount: 1000, paymentMethod: 'khalti' });

    expect(res.statusCode).toBe(200);
    expect(res.body.paymentMethod).toBe('khalti');
    expect(res.body.pidx).toBe(mockPidx);
    expect(res.body.paymentUrl).toContain('khalti');
  });

  it('[HAPPY] should save Khalti pidx as gatewayRefId in DB', async () => {
    const mockPidx = 'fake-pidx-saved-db';
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        pidx: mockPidx,
        payment_url: 'https://test-pay.khalti.com/?pidx=' + mockPidx,
      }),
    });

    await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ campaignId: activeCampaignId, amount: 1000, paymentMethod: 'khalti' });

    const txn = await Transaction.findOne({ gatewayRefId: mockPidx });
    expect(txn).not.toBeNull();
    expect(txn.gatewayRefId).toBe(mockPidx);
  });

  // Boundary: Minimum Amount
  it('[BOUNDARY] should return 400 when amount is NPR 9 (below minimum of NPR 10)', async () => {
    const res = await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ campaignId: activeCampaignId, amount: 9, paymentMethod: 'esewa' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/minimum amount/i);
  });

  it('[BOUNDARY] should accept exactly NPR 10 (minimum boundary)', async () => {
    const res = await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ campaignId: activeCampaignId, amount: 10, paymentMethod: 'esewa' });

    expect(res.statusCode).toBe(200);
  });

  // Role Restriction
  it('[NEGATIVE] should return 403 when a Creator tries to back a campaign', async () => {
    const { token: creatorToken } = await createAndLoginUser({
      role: 'creator',
      email: 'creator2@fundora.com',
      name: 'Creator 2',
    });

    const res = await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ campaignId: activeCampaignId, amount: 500, paymentMethod: 'esewa' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/creators cannot back/i);
  });

  // Campaign Not Found
  it('[NEGATIVE] should return 404 for a non-existent campaign', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ campaignId: fakeId.toString(), amount: 500, paymentMethod: 'esewa' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/campaign not found/i);
  });

  // Invalid Payment Method
  it('[NEGATIVE] should return an error for an unsupported payment method', async () => {
    const res = await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ campaignId: activeCampaignId, amount: 500, paymentMethod: 'stripe' });

    expect([400, 500]).toContain(res.statusCode);
  });

  // Khalti API failure
  it('[FAILURE] should return 500 when Khalti API returns no pidx (gateway error)', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        detail: 'Unauthorized',
      }),
    });

    const res = await request(app)
      .post('/api/payment/initiate')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ campaignId: activeCampaignId, amount: 1000, paymentMethod: 'khalti' });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/server error/i);
  });
});

// 2. eSewa PAYMENT VERIFICATION
describe('GET /api/payment/verify-esewa - Verify eSewa Payment', () => {
  let dbCreator;
  let activeCampaign;
  let pendingTransaction;
  const txnUuid = 'esewa-test-uuid-001';

  beforeEach(async () => {
    dbCreator = await User.create({
      name: 'Creator For eSewa',
      email: 'esewacreator@fundora.com',
      password: 'Pass123!',
      role: 'creator',
      isVerified: true,
    });
    activeCampaign = await createActiveTestCampaign(dbCreator._id);
    const dbBacker = await User.create({
      name: 'Test Backer eSewa',
      email: 'esewabackers@fundora.com',
      password: 'Pass123!',
      role: 'backer',
      isVerified: true,
    });
    pendingTransaction = await Transaction.create({
      user: dbBacker._id,
      campaign: activeCampaign._id,
      amount: 1000,
      gateway: 'esewa',
      transactionId: txnUuid,
      status: 'pending',
    });
  });

  // Happy Path
  it('[HAPPY] should verify eSewa payment with a valid base64 COMPLETE payload', async () => {
    const esewaData = buildEsewaPayload({
      status: 'COMPLETE',
      transaction_uuid: txnUuid,
      total_amount: '1000',
    });

    const res = await request(app).get(`/api/payment/verify-esewa?data=${esewaData}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/verification successful/i);
    expect(res.body.transaction.status).toBe('completed');
  });

  it('[HAPPY] should update campaign currentAmount after eSewa verification', async () => {
    const esewaData = buildEsewaPayload({
      status: 'COMPLETE',
      transaction_uuid: txnUuid,
      total_amount: '1000',
    });

    await request(app).get(`/api/payment/verify-esewa?data=${esewaData}`);

    const updatedCampaign = await Campaign.findById(activeCampaign._id);
    expect(updatedCampaign.currentAmount).toBe(1000);
  });

  it('[HAPPY] idempotency: double-verifying the same eSewa txn should return 200 without double-counting', async () => {
    const esewaData = buildEsewaPayload({
      status: 'COMPLETE',
      transaction_uuid: txnUuid,
      total_amount: '1000',
    });

    await request(app).get(`/api/payment/verify-esewa?data=${esewaData}`);
    const secondRes = await request(app).get(`/api/payment/verify-esewa?data=${esewaData}`);

    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.message).toMatch(/already verified/i);

    // Campaign amount must NOT be doubled
    const updatedCampaign = await Campaign.findById(activeCampaign._id);
    expect(updatedCampaign.currentAmount).toBe(1000);
  });

  // Negative Cases
  it('[NEGATIVE] should return 400 when data query param is missing', async () => {
    const res = await request(app).get('/api/payment/verify-esewa');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/missing payment data/i);
  });

  it('[FAILURE] should return 400 when eSewa status is NOT COMPLETE (e.g., FAILURE)', async () => {
    const esewaData = buildEsewaPayload({
      status: 'FAILURE',
      transaction_uuid: txnUuid,
    });

    const res = await request(app).get(`/api/payment/verify-esewa?data=${esewaData}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/payment failed or cancelled/i);
  });

  it('[FAILURE] should return 400 for completely tampered / non-base64 data', async () => {
    const res = await request(app).get('/api/payment/verify-esewa?data=THIS_IS_NOT_BASE64$$$$');

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid payment data/i);
  });

  it('[NEGATIVE] should return 404 if transaction_uuid does not exist in DB', async () => {
    const esewaData = buildEsewaPayload({
      status: 'COMPLETE',
      transaction_uuid: 'non-existent-uuid-999',
    });

    const res = await request(app).get(`/api/payment/verify-esewa?data=${esewaData}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/transaction not found/i);
  });
});

// 3. KHALTI PAYMENT VERIFICATION
describe('POST /api/payment/verify-khalti - Verify Khalti Payment', () => {
  let backerToken;
  let activeCampaign;
  const testPidx = 'khalti-test-pidx-001';

  beforeEach(async () => {
    const { token } = await createAndLoginUser({ role: 'backer', email: 'kbacker@fundora.com', name: 'Khalti Backer' });
    backerToken = token;
    const dbCreator = await User.create({
      name: 'Khalti Creator',
      email: 'khalticreator@fundora.com',
      password: 'Pass123!',
      role: 'creator',
      isVerified: true,
    });
    activeCampaign = await createActiveTestCampaign(dbCreator._id);
    const dbBacker = await User.findOne({ email: 'kbacker@fundora.com' });
    await Transaction.create({
      user: dbBacker._id,
      campaign: activeCampaign._id,
      amount: 2000,
      gateway: 'khalti',
      transactionId: `txn-khalti-${Date.now()}`,
      gatewayRefId: testPidx,
      status: 'pending',
    });
  });

  // Happy Path
  it('[HAPPY] should verify Khalti payment when lookup returns Completed status', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        pidx: testPidx,
        status: 'Completed',
        transaction_id: 'KHALTI-GW-TXN-001',
        total_amount: 200000,
      }),
    });

    const res = await request(app)
      .post('/api/payment/verify-khalti')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ pidx: testPidx });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/verification successful/i);
    expect(res.body.transaction.status).toBe('completed');
  });

  it('[HAPPY] should increment campaign currentAmount after Khalti verification', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        pidx: testPidx,
        status: 'Completed',
        transaction_id: 'KHALTI-GW-TXN-002',
        total_amount: 200000,
      }),
    });

    await request(app)
      .post('/api/payment/verify-khalti')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ pidx: testPidx });

    const updatedCampaign = await Campaign.findById(activeCampaign._id);
    expect(updatedCampaign.currentAmount).toBe(2000);
  });

  // Negative Cases
  it('[NEGATIVE] should return 400 when pidx is missing from body', async () => {
    const res = await request(app)
      .post('/api/payment/verify-khalti')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/missing pidx/i);
  });

  it('[FAILURE] should return 400 when Khalti lookup returns non-Completed status (e.g., Pending)', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        pidx: testPidx,
        status: 'Pending',
      }),
    });

    const res = await request(app)
      .post('/api/payment/verify-khalti')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ pidx: testPidx });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/not completed/i);
    expect(res.body.status).toBe('Pending');
  });

  it('[FAILURE] should return 400 when Khalti lookup returns Refunded (tampered/misused pidx)', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        pidx: testPidx,
        status: 'Refunded',
      }),
    });

    const res = await request(app)
      .post('/api/payment/verify-khalti')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ pidx: testPidx });

    expect(res.statusCode).toBe(400);
  });

  it('[NEGATIVE] should return 404 when pidx has no matching transaction in DB', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        pidx: 'completely-fake-pidx-000',
        status: 'Completed',
        transaction_id: 'KHALTI-GW-NONE',
        total_amount: 100000,
      }),
    });

    const res = await request(app)
      .post('/api/payment/verify-khalti')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ pidx: 'completely-fake-pidx-000' });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/transaction not found/i);
  });

  it('[HAPPY] should return 200 idempotently for an already-completed Khalti transaction', async () => {
    await Transaction.updateOne({ gatewayRefId: testPidx }, { status: 'completed' });

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        pidx: testPidx,
        status: 'Completed',
        transaction_id: 'KHALTI-GW-IDEMPOTENT',
        total_amount: 200000,
      }),
    });

    const res = await request(app)
      .post('/api/payment/verify-khalti')
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ pidx: testPidx });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/already verified/i);
  });
});

// 4. PAYMENT FAILURE HANDLER
describe('GET /api/payment/payment-failed/:id - Payment Failure Handler', () => {
  let pendingTxn;

  beforeEach(async () => {
    const dbUser = await User.create({
      name: 'Failure Backer',
      email: 'failbacker@fundora.com',
      password: 'Pass123!',
      role: 'backer',
      isVerified: true,
    });
    const dbCreator = await User.create({
      name: 'Failure Creator',
      email: 'failcreator@fundora.com',
      password: 'Pass123!',
      role: 'creator',
      isVerified: true,
    });
    const campaign = await createActiveTestCampaign(dbCreator._id);
    pendingTxn = await Transaction.create({
      user: dbUser._id,
      campaign: campaign._id,
      amount: 500,
      gateway: 'esewa',
      transactionId: 'fail-txn-uuid-001',
      status: 'pending',
    });
  });

  it('[HAPPY] should mark a pending transaction as failed', async () => {
    const res = await request(app).get(`/api/payment/payment-failed/${pendingTxn.transactionId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.transaction.status).toBe('failed');

    const dbTxn = await Transaction.findById(pendingTxn._id);
    expect(dbTxn.status).toBe('failed');
  });

  it('[NEGATIVE] should return 404 for a non-existent transaction ID', async () => {
    const res = await request(app).get('/api/payment/payment-failed/non-existent-id');

    expect(res.statusCode).toBe(404);
  });
});

// 5. REWARD REDEMPTION
describe('PUT /api/payment/transactions/:id/redeem - Reward Redemption', () => {
  let backerToken;
  let completedTxn;
  let pendingTxn;

  beforeEach(async () => {
    const { token } = await createAndLoginUser({ role: 'backer', email: 'rbacker@fundora.com', name: 'Reward Backer' });
    backerToken = token;
    const dbBacker = await User.findOne({ email: 'rbacker@fundora.com' });
    const dbCreator = await User.create({
      name: 'Reward Creator',
      email: 'rcreator@fundora.com',
      password: 'Pass123!',
      role: 'creator',
      isVerified: true,
    });
    const campaign = await createActiveTestCampaign(dbCreator._id);

    completedTxn = await Transaction.create({
      user: dbBacker._id,
      campaign: campaign._id,
      amount: 1000,
      gateway: 'esewa',
      transactionId: `completed-txn-${Date.now()}`,
      status: 'completed',
      paidAt: new Date(),
    });

    pendingTxn = await Transaction.create({
      user: dbBacker._id,
      campaign: campaign._id,
      amount: 500,
      gateway: 'khalti',
      transactionId: `pending-txn-${Date.now()}`,
      status: 'pending',
    });
  });

  it('[HAPPY] should mark a completed transaction reward as redeemed', async () => {
    const res = await request(app)
      .put(`/api/payment/transactions/${completedTxn._id}/redeem`)
      .set('Authorization', `Bearer ${backerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.transaction.rewardRedeemed).toBe(true);

    const dbTxn = await Transaction.findById(completedTxn._id);
    expect(dbTxn.rewardRedeemed).toBe(true);
  });

  it('[NEGATIVE] should return 400 when trying to redeem a pending transaction', async () => {
    const res = await request(app)
      .put(`/api/payment/transactions/${pendingTxn._id}/redeem`)
      .set('Authorization', `Bearer ${backerToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/completed transactions/i);
  });

  it('[NEGATIVE] should return 401 when no auth token provided', async () => {
    const res = await request(app).put(`/api/payment/transactions/${completedTxn._id}/redeem`);

    expect(res.statusCode).toBe(401);
  });

  it('[NEGATIVE] should return 404 when transaction belongs to a different user', async () => {
    const anotherBacker = await User.create({
      name: 'Another Backer',
      email: 'anotherbacker@fundora.com',
      password: 'Pass123!',
      role: 'backer',
      isVerified: true,
    });
    const { token: anotherToken } = await createAndLoginUser({
      role: 'backer',
      email: 'anotherbacker2@fundora.com',
      name: 'Another Backer 2',
    });

    const res = await request(app)
      .put(`/api/payment/transactions/${completedTxn._id}/redeem`)
      .set('Authorization', `Bearer ${anotherToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found or unauthorized/i);
  });
});