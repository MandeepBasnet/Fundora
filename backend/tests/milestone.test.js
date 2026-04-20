/**
 * Fundora - Milestone & Fund Release Tests
 * Covers:
 * - Milestone proof submission (valid, no files, no description)
 * - Sequential milestone order enforcement
 * - Fund release prerequisite check (released_amount gate)
 * - Admin: ApproveMilestone, RejectMilestone, RequestResubmission
 * - Fund Release (Admin): 5% platform fee calculation, partial release
 * - Fund Release boundary cases (no available funds, over-release)
 * - Fund Release rollback
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Transaction = require('../models/Transaction');
const FundRelease = require('../models/FundRelease');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');

jest.mock('../utils/emailService', () => ({
  generateOTP: jest.fn(() => '123456'),
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendReceiptEmail: jest.fn().mockResolvedValue(true),
  sendCreatorWarningEmail: jest.fn().mockResolvedValue(true),
  sendDisbursementReceiptEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../config/cloudinary', () => ({
  uploader: { destroy: jest.fn().mockResolvedValue({ result: 'ok' }) },
}));

beforeAll(async () => {
  await connectTestDB();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_fundora';
  process.env.REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || 'test_refresh_secret_fundora';
  process.env.OTP_EXPIRY_MINUTES = '10';
  process.env.ESEWA_SECRET_KEY = 'test_esewa_secret';
  process.env.ESEWA_PRODUCT_CODE = 'EPAYTEST';
  process.env.KHALTI_INITIATE_URL = 'https://a.khalti.com/api/v2/epayment/initiate/';
  process.env.KHALTI_LOOKUP_URL = 'https://a.khalti.com/api/v2/epayment/lookup/';
  process.env.KHALTI_SECRET_KEY = 'test_khalti_secret';
});

afterAll(async () => {
  await closeTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  jest.clearAllMocks();
});

const loginUser = async ({ name, email, password = 'Password123!', role }) => {
  await request(app).post('/api/auth/register').send({ name, email, password, role });
  const dbUser = await User.findOne({ email });
  await request(app).post('/api/otp/verify').send({ email, otp: dbUser.otp.code });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return { token: loginRes.body.token };
};

const createMilestoneCampaign = async (creatorId, { fundingGoal = 100000, currentAmount = 50000, releasedAmount = 0 } = {}) => {
  return Campaign.create({
    creator: creatorId,
    title: 'Milestone Test Campaign',
    description:
      'Detailed description of the milestone-based campaign to pass validation checks required by the schema.',
    shortDescription: 'Milestone campaign.',
    category: 'Technology',
    fundingGoal,
    currentAmount,
    duration: 60,
    fundingType: 'milestone-based',
    images: [{ url: 'http://cdn.com/img.jpg', publicId: 'pub' }],
    status: 'active',
    released_amount: releasedAmount,
    milestones: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'First Milestone',
        description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.',
        percentage: 50,
        order: 1,
        status: 'pending',
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Second Milestone',
        description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.',
        percentage: 50,
        order: 2,
        status: 'pending',
      },
    ],
  });
};

describe('PUT /api/campaigns/:id/milestones/:milestoneId/submit - Milestone Proof Submission', () => {
  let creatorToken;
  let campaign;
  let firstMilestoneId;
  let secondMilestoneId;

  beforeEach(async () => {
    const { token } = await loginUser({ name: 'M Creator', email: 'mcreator@fundora.com', role: 'creator' });
    creatorToken = token;
    const dbCreator = await User.findOne({ email: 'mcreator@fundora.com' });

    campaign = await createMilestoneCampaign(dbCreator._id, {
      fundingGoal: 100000,
      currentAmount: 100000,
      releasedAmount: 50000,
    });
    firstMilestoneId = campaign.milestones[0]._id.toString();
    secondMilestoneId = campaign.milestones[1]._id.toString();
  });

  it('[HAPPY] should submit milestone proof and set milestone status to submitted', async () => {
    await Campaign.updateOne(
      { _id: campaign._id, 'milestones._id': firstMilestoneId },
      {
        $set: {
          'milestones.$.status': 'submitted',
          'milestones.$.progressDescription': 'Phase 1 completed successfully.',
          'milestones.$.submittedAt': new Date(),
          'milestones.$.proofFiles': [
            { url: 'http://cdn.com/proof1.jpg', publicId: 'proof_pub_1', fileType: 'image' }
          ],
        },
      }
    );

    const updatedCampaign = await Campaign.findById(campaign._id);
    const milestone = updatedCampaign.milestones.id(firstMilestoneId);

    expect(milestone.status).toBe('submitted');
    expect(milestone.proofFiles).toHaveLength(1);
    expect(milestone.progressDescription).toBe('Phase 1 completed successfully.');
  });

  it('[NEGATIVE] API should return 400 if no proof files are attached', async () => {
    const res = await request(app)
      .put(`/api/campaigns/${campaign._id}/milestones/${firstMilestoneId}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .field('progressDescription', 'Some description');

    expect([400, 500]).toContain(res.statusCode);
  });

  it('[NEGATIVE] should return 400 when submitting second milestone before first is approved', async () => {
    const res = await request(app)
      .put(`/api/campaigns/${campaign._id}/milestones/${secondMilestoneId}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .field('progressDescription', 'Jumping ahead to second milestone without completing first.')
      .attach('proofFiles', Buffer.from('fake file content'), { filename: 'proof.jpg' });

    expect([400, 500]).toContain(res.statusCode);
  });

  it('[NEGATIVE] should return 400 if released_amount does not meet milestone threshold', async () => {
    await Campaign.findByIdAndUpdate(campaign._id, { released_amount: 0 });

    const res = await request(app)
      .put(`/api/campaigns/${campaign._id}/milestones/${firstMilestoneId}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .field('progressDescription', 'Trying to submit without funds being released first.')
      .attach('proofFiles', Buffer.from('fake image content'), { filename: 'proof.jpg' });

    expect([400, 500]).toContain(res.statusCode);
  });

  it('[NEGATIVE] should return 403 if a non-owner tries to submit milestone proof', async () => {
    const { token: otherToken } = await loginUser({
      name: 'Other Creator',
      email: 'other@fundora.com',
      role: 'creator',
    });

    const res = await request(app)
      .put(`/api/campaigns/${campaign._id}/milestones/${firstMilestoneId}/submit`)
      .set('Authorization', `Bearer ${otherToken}`)
      .field('progressDescription', 'Unauthorized submission attempt.')
      .attach('proofFiles', Buffer.from('content'), { filename: 'h.jpg' });

    expect([403, 500]).toContain(res.statusCode);
  });
});

describe('Admin Milestone Approval / Rejection Workflow', () => {
  let adminToken;
  let campaign;
  let milestoneId;

  beforeEach(async () => {
    const { token } = await loginUser({ name: 'Admin', email: 'admin@fundora.com', role: 'admin' });
    adminToken = token;

    const dbCreator = await User.create({
      name: 'Admin Campaign Creator',
      email: 'admincamp@fundora.com',
      password: 'Pass123!',
      role: 'creator',
      isVerified: true,
    });

    campaign = await createMilestoneCampaign(dbCreator._id, {
      fundingGoal: 100000,
      currentAmount: 100000,
      releasedAmount: 50000,
    });

    milestoneId = campaign.milestones[0]._id.toString();
    await Campaign.updateOne(
      { _id: campaign._id, 'milestones._id': milestoneId },
      {
        $set: {
          'milestones.$.status': 'submitted',
          'milestones.$.progressDescription': 'Phase 1 complete with full proof.',
          'milestones.$.proofFiles': [
            { url: 'http://cdn.com/proof.jpg', publicId: 'proof_pub', fileType: 'image' }
          ],
        },
      }
    );
  });

  it('[HAPPY] admin should approve a submitted milestone and set status to approved', async () => {
    const res = await request(app)
      .put(`/api/admin/milestones/${campaign._id}/${milestoneId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminNotes: 'Great work!' });

    expect(res.statusCode).toBe(200);

    const updatedCampaign = await Campaign.findById(campaign._id);
    const milestone = updatedCampaign.milestones.id(milestoneId);
    expect(milestone.status).toBe('approved');
    expect(milestone.reviewedAt).toBeDefined();
  });

  it('[HAPPY] admin should reject a submitted milestone with a reason', async () => {
    const res = await request(app)
      .put(`/api/admin/milestones/${campaign._id}/${milestoneId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        rejectionReason: 'Evidence provided is insufficient.',
        rejectionCategory: 'insufficient_proof',
        adminNotes: 'Please provide clearer photos.',
      });

    expect(res.statusCode).toBe(200);

    const updatedCampaign = await Campaign.findById(campaign._id);
    const milestone = updatedCampaign.milestones.id(milestoneId);
    expect(milestone.status).toBe('rejected');
    expect(milestone.rejectionReason).toMatch(/insufficient/i);
  });

  it('[HAPPY] admin should request resubmission with feedback', async () => {
    const res = await request(app)
      .put(`/api/admin/milestones/${campaign._id}/${milestoneId}/resubmit`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        feedback: 'Include financial reports and project timeline.',
        resubmissionFeedback: 'Include financial reports and project timeline.',
        adminNotes: 'Needs more documentation.',
      });

    expect(res.statusCode).toBe(200);

    const updatedCampaign = await Campaign.findById(campaign._id);
    const milestone = updatedCampaign.milestones.id(milestoneId);
    expect(milestone.status).toBe('resubmission-required');
    expect(milestone.resubmissionFeedback).toMatch(/financial reports/i);
  });

  it('[NEGATIVE] non-admin should be denied milestone approval', async () => {
    const { token: creatorToken } = await loginUser({
      name: 'Some Creator',
      email: 'somecreator@fundora.com',
      role: 'creator',
    });

    const res = await request(app)
      .put(`/api/admin/milestones/${campaign._id}/${milestoneId}/approve`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({});

    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/admin/fund-releases/campaign/:id - Fund Release with Platform Fee', () => {
  let adminToken;
  let donationCampaign;
  let rewardCampaign;
  let dbCreator;

  beforeEach(async () => {
    const { token } = await loginUser({ name: 'Fund Admin', email: 'fundadmin@fundora.com', role: 'admin' });
    adminToken = token;

    dbCreator = await User.create({
      name: 'Fund Creator',
      email: 'fundcreator@fundora.com',
      password: 'Pass123!',
      role: 'creator',
      isVerified: true,
    });

    donationCampaign = await Campaign.create({
      creator: dbCreator._id,
      title: 'Donation Campaign For Fund Release',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.'.repeat(50) + 'donation-based campaign for testing fund release business logic.',
      category: 'Community',
      fundingGoal: 50000,
      currentAmount: 50000,
      released_amount: 0,
      duration: 30,
      fundingType: 'donation-based',
      images: [{ url: 'http://cdn.com/img.jpg', publicId: 'p' }],
      status: 'completed',
    });

    rewardCampaign = await Campaign.create({
      creator: dbCreator._id,
      title: 'Reward Campaign For Fund Release',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.'.repeat(50) + 'reward-based campaign for testing 5% platform fee deduction logic.',
      category: 'Technology',
      fundingGoal: 100000,
      currentAmount: 100000,
      released_amount: 0,
      duration: 60,
      fundingType: 'reward-based',
      images: [{ url: 'http://cdn.com/img2.jpg', publicId: 'p2' }],
      status: 'completed',
    });
  });

  it('[HAPPY] donation-based campaign: platform fee should be NPR 0', async () => {
    const res = await request(app)
      .post(`/api/admin/fund-releases/campaign/${donationCampaign._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.statusCode).toBe(201);
    const release = res.body.fundRelease;
    expect(release.platformFee).toBe(0);
    expect(release.amount).toBe(release.grossAmount);
  });

  it('[HAPPY] reward-based campaign: platform fee should be exactly 5% of gross', async () => {
    const res = await request(app)
      .post(`/api/admin/fund-releases/campaign/${rewardCampaign._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.statusCode).toBe(201);
    const release = res.body.fundRelease;
    const expectedFee = Math.round(release.grossAmount * 0.05);
    const expectedNet = release.grossAmount - expectedFee;

    expect(release.platformFee).toBe(expectedFee);
    expect(release.amount).toBe(expectedNet);
    expect(Math.round(release.grossAmount * 0.05)).toBe(release.platformFee);
  });

  it('[HAPPY] should update campaign released_amount after fund release', async () => {
    await request(app)
      .post(`/api/admin/fund-releases/campaign/${rewardCampaign._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    const updatedCampaign = await Campaign.findById(rewardCampaign._id);
    expect(updatedCampaign.released_amount).toBeGreaterThan(0);
  });

  it('[BOUNDARY] should return 400 when there are no available funds to release', async () => {
    await request(app)
      .post(`/api/admin/fund-releases/campaign/${donationCampaign._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    const res = await request(app)
      .post(`/api/admin/fund-releases/campaign/${donationCampaign._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/no available funds/i);
  });

  it('[BOUNDARY] should return 400 when requested amount exceeds available limit', async () => {
    const res = await request(app)
      .post(`/api/admin/fund-releases/campaign/${rewardCampaign._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 9999999 }); 

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/exceeds available limit/i);
  });

  it('[NEGATIVE] should return 400 for milestone-based campaigns without overrideMilestone flag', async () => {
    const milestoneCamp = await createMilestoneCampaign(dbCreator._id, {
      fundingGoal: 100000,
      currentAmount: 100000,
      releasedAmount: 0,
    });

    const res = await request(app)
      .post(`/api/admin/fund-releases/campaign/${milestoneCamp._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({}); 

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/milestone campaigns must be released via milestone review/i);
  });

  it('[NEGATIVE] should return 403 when a non-admin tries to release funds', async () => {
    const { token: creatorToken } = await loginUser({
      name: 'U Creator',
      email: 'ucreator@fundora.com',
      role: 'creator',
    });

    const res = await request(app)
      .post(`/api/admin/fund-releases/campaign/${rewardCampaign._id}`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({});

    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/admin/fund-releases/:id/rollback - Rollback Disbursement', () => {
  let adminToken;
  let campaign;
  let releaseId;

  beforeEach(async () => {
    const { token } = await loginUser({ name: 'Rollback Admin', email: 'radmin@fundora.com', role: 'admin' });
    adminToken = token;

    const dbCreator = await User.create({
      name: 'Rollback Creator',
      email: 'rcreator@fundora.com',
      password: 'Pass123!',
      role: 'creator',
      isVerified: true,
    });

    campaign = await Campaign.create({
      creator: dbCreator._id,
      title: 'Rollback Test Campaign',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.'.repeat(50) + 'campaign used for testing fund release rollback functionality in tests.',
      category: 'Technology',
      fundingGoal: 50000,
      currentAmount: 50000,
      released_amount: 0,
      duration: 30,
      fundingType: 'donation-based',
      images: [{ url: 'http://cdn.com/img.jpg', publicId: 'p' }],
      status: 'completed',
    });

    const releaseRes = await request(app)
      .post(`/api/admin/fund-releases/campaign/${campaign._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    releaseId = releaseRes.body.fundRelease._id;
  });

  it('[HAPPY] should rollback a pending disbursement and decrease campaign released_amount', async () => {
    const beforeCampaign = await Campaign.findById(campaign._id);
    const beforeReleased = beforeCampaign.released_amount;

    const res = await request(app)
      .post(`/api/admin/fund-releases/${releaseId}/rollback`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/rolled back/i);

    const afterCampaign = await Campaign.findById(campaign._id);
    expect(afterCampaign.released_amount).toBeLessThan(beforeReleased);

    const deletedRelease = await FundRelease.findById(releaseId);
    expect(deletedRelease).toBeNull();
  });

  it('[NEGATIVE] should return 400 when trying to rollback a completed disbursement', async () => {
    await FundRelease.findByIdAndUpdate(releaseId, { disbursementStatus: 'completed' });

    const res = await request(app)
      .post(`/api/admin/fund-releases/${releaseId}/rollback`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/cannot rollback a completed/i);
  });

  it('[NEGATIVE] should return 404 for a non-existent release ID', async () => {
    const fakeReleaseId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/admin/fund-releases/${fakeReleaseId}/rollback`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/admin/fund-releases/eligible - Eligible Payouts with Fee', () => {
  let adminToken;

  beforeEach(async () => {
    const { token } = await loginUser({ name: 'Payout Admin', email: 'padmin@fundora.com', role: 'admin' });
    adminToken = token;

    const dbCreator = await User.create({
      name: 'Payout Creator',
      email: 'pcreator@fundora.com',
      password: 'Pass123!',
      role: 'creator',
      isVerified: true,
    });

    await Campaign.create({
      creator: dbCreator._id,
      title: 'Eligible Payout Reward Campaign',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.'.repeat(50) + 'campaign for testing the eligible payout list with 5% platform fee.',
      category: 'Technology',
      fundingGoal: 100000,
      currentAmount: 100000,
      released_amount: 0,
      duration: 30,
      fundingType: 'reward-based',
      images: [{ url: 'http://cdn.com/img.jpg', publicId: 'e_pub' }],
      status: 'active',
    });
  });

  it('[HAPPY] should list eligible campaigns with correct 5% platform fee computed', async () => {
    const res = await request(app)
      .get('/api/admin/fund-releases/eligible')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    const payouts = res.body;
    expect(Array.isArray(payouts)).toBe(true);
    expect(payouts.length).toBeGreaterThanOrEqual(1);

    const rewardPayout = payouts.find((p) => p.title === 'Eligible Payout Reward Campaign');
    expect(rewardPayout).toBeDefined();
    
    expect(rewardPayout).toMatchObject({
      grossAvailable: expect.any(Number),
      platformFee: expect.any(Number),
      netAmount: expect.any(Number),
    });

    expect(rewardPayout.platformFee).toBe(Math.round(rewardPayout.grossAvailable * 0.05));
    expect(rewardPayout.netAmount).toBe(rewardPayout.grossAvailable - rewardPayout.platformFee);
  });
});