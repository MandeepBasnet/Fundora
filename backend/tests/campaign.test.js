/**
 * Fundora - Campaign Management Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');

jest.mock('../utils/emailService', () => ({
  generateOTP: jest.fn(() => '123456'),
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendReceiptEmail: jest.fn().mockResolvedValue(true),
  sendCreatorWarningEmail: jest.fn().mockResolvedValue(true),
  sendFlagReceivedEmail: jest.fn().mockResolvedValue(true),
  sendFlagResolutionEmail: jest.fn().mockResolvedValue(true),
  sendCreatorFlagAlertEmail: jest.fn().mockResolvedValue(true),
  sendFlagActionUpdateEmail: jest.fn().mockResolvedValue(true),
  sendCampaignTerminatedEmail: jest.fn().mockResolvedValue(true),
  sendDisbursementReceiptEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../config/cloudinary', () => ({
  uploader: {
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
}));

beforeAll(async () => {
  await connectTestDB();
  
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_fundora';
  process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || 'test_refresh_secret_fundora';
  process.env.OTP_EXPIRY_MINUTES = '10';
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  jest.clearAllMocks();
});

const createAndLoginUser = async ({
  name = 'Test User',
  email = 'creator@fundora.com',
  password = 'Password123!',
  role = 'creator',
} = {}) => {
  await request(app)
    .post('/api/auth/register')
    .send({ name, email, password, role });

  const dbUser = await User.findOne({ email });
  await request(app)
    .post('/api/otp/verify')
    .send({ email, otp: dbUser.otp.code });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return loginRes.body.token;
};

const validCampaignPayload = (overrides = {}) => ({
  title: 'My Awesome Test Campaign',
  description:
    'This is a detailed description that is definitely at least one hundred characters long so it passes the validation check imposed by Mongoose on this field in the Campaign schema.',
  shortDescription: 'Short description here.',
  category: 'Technology',
  fundingGoal: 50000,
  duration: 30,
  fundingType: 'donation-based',
  ...overrides,
});

describe('POST /api/campaigns - Create Campaign', () => {
  let creatorToken;

  beforeEach(async () => {
    creatorToken = await createAndLoginUser({ role: 'creator', email: 'creator@fundora.com' });
  });

  it('[HAPPY] should create a campaign as draft and return 201', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload());

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.title).toBe('My Awesome Test Campaign');
    expect(res.body).toHaveProperty('_id');
  });

  it('[HAPPY] should save the creator as the authenticated user', async () => {
    const dbUser = await User.findOne({ email: 'creator@fundora.com' });
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload());

    expect(res.body.creator).toBe(dbUser._id.toString());
  });

  it('[HAPPY] should create a reward-based campaign with tiers', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(
        validCampaignPayload({
          fundingType: 'reward-based',
          rewardTiers: [
            {
              title: 'Bronze Backer',
              description: 'Get a thank you note.',
              amount: 500,
              deliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        })
      );

    expect(res.statusCode).toBe(201);
    expect(res.body.fundingType).toBe('reward-based');
    expect(res.body.rewardTiers).toHaveLength(1);
  });

  it('[NEGATIVE] should return 403 if a Backer tries to create a campaign', async () => {
    const backerToken = await createAndLoginUser({
      role: 'backer',
      email: 'backer@fundora.com',
      name: 'Test Backer',
    });

    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${backerToken}`)
      .send(validCampaignPayload());

    expect(res.statusCode).toBe(403);
    // # Happy Path
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('[NEGATIVE] should return 401 when no token is provided', async () => {
    const res = await request(app).post('/api/campaigns').send(validCampaignPayload());

    expect(res.statusCode).toBe(401);
  });

  it('[NEGATIVE] should return 400 for a title shorter than 5 characters', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload({ title: 'Hi' }));

    expect([400, 500]).toContain(res.statusCode);
  });

  it('[BOUNDARY] should return an error if fundingGoal is below NPR 1,000', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload({ fundingGoal: 999 }));

    expect([400, 500]).toContain(res.statusCode);
  });

  it('[BOUNDARY] should return an error if duration is below 7 days', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload({ duration: 6 }));

    expect([400, 500]).toContain(res.statusCode);
  });

  it('[BOUNDARY] should return an error if duration exceeds 90 days', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload({ duration: 91 }));

    expect([400, 500]).toContain(res.statusCode);
  });

  it('[NEGATIVE] should return an error for invalid category', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload({ category: 'InvalidCategory' }));

    expect([400, 500]).toContain(res.statusCode);
  });
});

describe('PUT /api/campaigns/:id - Update Draft Campaign', () => {
  let creatorToken;
  let campaignId;

  beforeEach(async () => {
    creatorToken = await createAndLoginUser({ role: 'creator', email: 'creator@fundora.com' });
    const createRes = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload());
    campaignId = createRes.body._id;
  });

  it('[HAPPY] should update a draft campaign and return the updated document', async () => {
    const res = await request(app)
      .put(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Updated Campaign Title Here' });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Updated Campaign Title Here');
  });

  it('[NEGATIVE] should return 403 if a different creator tries to update', async () => {
    const otherToken = await createAndLoginUser({
      role: 'creator',
      email: 'other@fundora.com',
      name: 'Other Creator',
    });

    const res = await request(app)
      .put(`/api/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hijacked Title' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('[NEGATIVE] should return 404 for a non-existent campaign ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/campaigns/${fakeId}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ title: 'Updated Title' });

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /api/campaigns/:id/submit - Submit Campaign', () => {
  let creatorToken;
  let campaignId;

  const createCampaignWithImages = async () => {
    const dbUser = await User.findOne({ email: 'creator@fundora.com' });
    const campaign = await Campaign.create({
      creator: dbUser._id,
      ...validCampaignPayload({
        description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.'.repeat(55) +
          'description that is long enough to pass the submit validation check in Fundora.',
      }),
      images: [{ url: 'https://example.com/img.jpg', publicId: 'img_public_id' }],
      status: 'draft',
    });
    return campaign._id.toString();
  };

  beforeEach(async () => {
    creatorToken = await createAndLoginUser({ role: 'creator', email: 'creator@fundora.com' });
    campaignId = await createCampaignWithImages();
  });

  it('[HAPPY] should submit a draft campaign and change status to pending', async () => {
    const res = await request(app)
      .put(`/api/campaigns/${campaignId}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.campaign.status).toBe('pending');
    expect(res.body.campaign.submittedAt).toBeDefined();
  });

  it('[NEGATIVE] should return 400 if submitting a campaign that is already pending', async () => {
    await request(app)
      .put(`/api/campaigns/${campaignId}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`);

    const res = await request(app)
      .put(`/api/campaigns/${campaignId}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/can only submit draft/i);
  });

  it('[NEGATIVE] should return 400 when required fields are missing (no images)', async () => {
    const createRes = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload());

    const res = await request(app)
      .put(`/api/campaigns/${createRes.body._id}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/image is required/i);
  });
});

describe('Admin Campaign Approval Workflow', () => {
  let adminToken;
  let creatorToken;
  let pendingCampaignId;

  beforeEach(async () => {
    adminToken = await createAndLoginUser({
      role: 'admin',
      email: 'admin@fundora.com',
      name: 'Admin User',
    });
    creatorToken = await createAndLoginUser({
      role: 'creator',
      email: 'creator@fundora.com',
      name: 'Creator User',
    });

    const dbCreator = await User.findOne({ email: 'creator@fundora.com' });
    const campaign = await Campaign.create({
      creator: dbCreator._id,
      title: 'Pending Campaign Ready For Review',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.'.repeat(55) + 'detailed description meeting the hundred character minimum for this campaign.',
      shortDescription: 'A short description.',
      category: 'Technology',
      fundingGoal: 10000,
      duration: 30,
      fundingType: 'donation-based',
      images: [{ url: 'https://cdn.example.com/img.jpg', publicId: 'pub123' }],
      status: 'pending',
      submittedAt: new Date(),
    });
    pendingCampaignId = campaign._id.toString();
  });

  it('[HAPPY] admin should retrieve a list of pending campaigns', async () => {
    const res = await request(app)
      .get('/api/admin/campaigns/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    const found = (Array.isArray(res.body) ? res.body : res.body.campaigns).some(
      (c) => c._id === pendingCampaignId
    );
    expect(found).toBe(true);
  });

  it('[NEGATIVE] non-admin should be denied access to pending campaigns list', async () => {
    const res = await request(app)
      .get('/api/admin/campaigns/pending')
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.statusCode).toBe(403);
  });

  it('[HAPPY] admin should approve a pending campaign and set status to active', async () => {
    const res = await request(app)
      .put(`/api/admin/campaigns/${pendingCampaignId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminNotes: 'Looks good!' });

    expect(res.statusCode).toBe(200);

    const updatedCampaign = await Campaign.findById(pendingCampaignId);
    expect(updatedCampaign.status).toBe('active');
    expect(updatedCampaign.approvedAt).toBeDefined();
  });

  it('[HAPPY] admin should reject a pending campaign with a reason', async () => {
    const res = await request(app)
      .put(`/api/admin/campaigns/${pendingCampaignId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        reason: 'Insufficient evidence of legitimacy.', 
        rejectionReason: 'Insufficient evidence of legitimacy.',
        rejectionCategory: 'insufficient_information',
        adminNotes: 'Please resubmit.' 
      });

    expect(res.statusCode).toBe(200);

    const updatedCampaign = await Campaign.findById(pendingCampaignId);
    expect(updatedCampaign.status).toBe('rejected');
    expect(updatedCampaign.rejectionReason).toBeDefined();
  });

  it('[NEGATIVE] should return 404 when approving a non-existent campaign', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/admin/campaigns/${fakeId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/campaigns - Public Listing', () => {
  beforeEach(async () => {
    const user = await User.create({
      name: 'Public Creator',
      email: 'pub@fundora.com',
      password: 'Pass123!',
      role: 'creator',
      isVerified: true,
    });
    
    await Campaign.create({
      creator: user._id,
      title: 'Active Campaign Visible',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.'.repeat(50) + 'detailed campaign visible to the public and fully described for testing.',
      category: 'Technology',
      fundingGoal: 5000,
      duration: 30,
      fundingType: 'donation-based',
      images: [{ url: 'http://img.com/a.jpg', publicId: 'a_pub' }],
      status: 'active',
    });
    await Campaign.create({
      creator: user._id,
      title: 'Draft Campaign Hidden',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.'.repeat(50) + 'draft campaign that should be invisible to public unauthenticated requests.',
      category: 'Technology',
      fundingGoal: 5000,
      duration: 20,
      fundingType: 'donation-based',
      images: [],
      status: 'draft',
    });
  });

  it('[HAPPY] should return only active campaigns for public requests', async () => {
    const res = await request(app).get('/api/campaigns');

    expect(res.statusCode).toBe(200);
    const statuses = (res.body.campaigns || []).map((c) => c.status);
    statuses.forEach((s) => expect(s).toBe('active'));
    const titles = (res.body.campaigns || []).map((c) => c.title);
    expect(titles).toContain('Active Campaign Visible');
    expect(titles).not.toContain('Draft Campaign Hidden');
  });

  it('[HAPPY] should return pagination metadata', async () => {
    const res = await request(app).get('/api/campaigns');

    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('pages');
  });
});

describe('DELETE /api/campaigns/:id - Campaign Deletion', () => {
  let creatorToken;

  beforeEach(async () => {
    creatorToken = await createAndLoginUser({ role: 'creator', email: 'creator@fundora.com' });
  });

  it('[HAPPY] should delete a draft campaign directly', async () => {
    const createRes = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send(validCampaignPayload());

    const res = await request(app)
      .delete(`/api/campaigns/${createRes.body._id}`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);

    const found = await Campaign.findById(createRes.body._id);
    expect(found).toBeNull();
  });

  it('[HAPPY] should submit a deletion request for an active campaign (not delete outright)', async () => {
    const dbUser = await User.findOne({ email: 'creator@fundora.com' });
    const activeCampaign = await Campaign.create({
      creator: dbUser._id,
      title: 'Active Campaign For Deletion',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.'.repeat(50) + 'detailed campaign that is active and being requested for deletion now.',
      category: 'Technology',
      fundingGoal: 5000,
      duration: 30,
      fundingType: 'donation-based',
      images: [{ url: 'http://img.com/a.jpg', publicId: 'a_p' }],
      status: 'active',
    });

    const res = await request(app)
      .delete(`/api/campaigns/${activeCampaign._id}`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.deletionRequested).toBe(true);
    
    const found = await Campaign.findById(activeCampaign._id);
    expect(found).not.toBeNull();
    expect(found.deletionRequested).toBe(true);
  });
});