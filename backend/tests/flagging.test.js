const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Flag = require('../models/Flag');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');

// # Mock all email functions
jest.mock('../utils/emailService', () => ({
  generateOTP: jest.fn(() => '123456'),
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendReceiptEmail: jest.fn().mockResolvedValue(true),
  sendFlagReceivedEmail: jest.fn().mockResolvedValue(true),
  sendFlagResolutionEmail: jest.fn().mockResolvedValue(true),
  sendCreatorWarningEmail: jest.fn().mockResolvedValue(true),
  sendCampaignTerminatedEmail: jest.fn().mockResolvedValue(true),
  sendFlagActionUpdateEmail: jest.fn().mockResolvedValue(true),
  sendCreatorFlagAlertEmail: jest.fn().mockResolvedValue(true),
  sendDisbursementReceiptEmail: jest.fn().mockResolvedValue(true),
}));

// # Lifecycle
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

// # 
// HELPERS
// # 

/** Registers + verifies + logs in. Returns token. */
const loginUser = async ({ name, email, password = 'Password123!', role }) => {
  await request(app).post('/api/auth/register').send({ name, email, password, role });
  const dbUser = await User.findOne({ email });
  await request(app).post('/api/otp/verify').send({ email, otp: dbUser.otp.code });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  return { token: loginRes.body.token, id: loginRes.body._id };
};

/** Creates a verified user directly in DB (no OTP flow overhead). */
const createVerifiedUser = async ({ name, email, role = 'backer' }) => {
  const user = await User.create({
    name,
    email,
    password: 'Password123!',
    role,
    isVerified: true,
  });
  return user;
};

/** Creates an active campaign owned by the given creatorId. */
const createActiveCampaign = async (creatorId, titleSuffix = '') =>
  Campaign.create({
    creator: creatorId,
    title: `Active Campaign ${titleSuffix}`.trim(),
    description:
      'A detailed description of the campaign that is well over one hundred characters long to satisfy the minimum length validation rule.',
    shortDescription: 'Short blurb.',
    category: 'Technology',
    fundingGoal: 20000,
    currentAmount: 0,
    duration: 30,
    fundingType: 'donation-based',
    images: [{ url: 'https://cdn.test/img.jpg', publicId: 'pub_img' }],
    status: 'active',
    activeFlagCount: 0,
  });

/** Minimum valid flag payload. */
const validFlagBody = (campaignId, overrides = {}) => ({
  campaignId,
  reason: 'Fraud/Scam',
  description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.' +
    'the product does not exist. Multiple community members have raised concerns about ' +
    'the legitimacy of the project and its creator.',
  ...overrides,
});

// # 
// 1. CREATING FLAGS
// # 
describe('POST /api/flags - Create Flag / Report', () => {
  let reporterToken;
  let targetCampaignId;

  beforeEach(async () => {
    const { token } = await loginUser({ name: 'Reporter', email: 'reporter@fundora.com', role: 'backer' });
    reporterToken = token;

    const creator = await createVerifiedUser({ name: 'Target Creator', email: 'tgtcreator@fundora.com', role: 'creator' });
    const campaign = await createActiveCampaign(creator._id, 'For Flagging');
    targetCampaignId = campaign._id.toString();
  });

  // # Happy Path
  it('[HAPPY] should create a flag and return 201 with flag id + status', async () => {
    const res = await request(app)
      .post('/api/flags')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send(validFlagBody(targetCampaignId));


    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.flag).toHaveProperty('id');
    expect(res.body.flag.status).toBe('pending');
  });

  it('[HAPPY] should increment campaign activeFlagCount by 1 after flagging', async () => {
    await request(app)
      .post('/api/flags')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send(validFlagBody(targetCampaignId));

    const updatedCampaign = await Campaign.findById(targetCampaignId);
    expect(updatedCampaign.activeFlagCount).toBe(1);
  });

  it('[HAPPY] should call sendFlagReceivedEmail after a flag is created', async () => {
    const { sendFlagReceivedEmail } = require('../utils/emailService');
    await request(app)
      .post('/api/flags')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send(validFlagBody(targetCampaignId));

    expect(sendFlagReceivedEmail).toHaveBeenCalledTimes(1);
  });

  // # Duplicate Flag
  it('[NEGATIVE] should return 400 if the same user tries to flag the same campaign twice', async () => {
    await request(app)
      .post('/api/flags')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send(validFlagBody(targetCampaignId));

    const res = await request(app)
      .post('/api/flags')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send(validFlagBody(targetCampaignId));


    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already reported/i);
  });

  // # Campaign Not Found
  it('[NEGATIVE] should return 404 when flagging a non-existent campaign', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post('/api/flags')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send(validFlagBody(fakeId.toString()));


    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/campaign not found/i);
  });

  // # Auth Guard
  it('[NEGATIVE] should return 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post('/api/flags')
      .send(validFlagBody(targetCampaignId));


    expect(res.statusCode).toBe(401);
  });

  // # Flagging Restriction
  it('[NEGATIVE] should return 403 when reporter has an active flagging restriction', async () => {
    // Manually restrict the reporter
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
    await User.findOneAndUpdate(
      { email: 'reporter@fundora.com' },
      { flaggingRestrictedUntil: futureDate }
    );

    const res = await request(app)
      .post('/api/flags')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send(validFlagBody(targetCampaignId));


    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/restricted from submitting reports/i);
  });

  // # Validation
  it('[NEGATIVE] should return 400 when flag description is too short (< 100 chars)', async () => {
    const res = await request(app)
      .post('/api/flags')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send(
        validFlagBody(targetCampaignId, {
          description: 'Too short.', // Way below 100-char minimum
        })
      );


    // Mongoose validation error → 400 or 500
    expect([400, 500]).toContain(res.statusCode);
  });
});

// # 
// 2. AUTO-SUSPENSION BOUNDARY TEST (EXACTLY 5 FLAGS)
// # 
describe('Auto-Suspension Trigger — 5-Flag Boundary', () => {
  let creatorCampaignId;
  let backersTokens;

  beforeEach(async () => {
    const creator = await createVerifiedUser({ name: 'Boundary Creator', email: 'bcreator@fundora.com', role: 'creator' });
    const campaign = await createActiveCampaign(creator._id, 'Boundary Test');
    creatorCampaignId = campaign._id.toString();

    // Create 6 distinct backer users (need at least 5 unique flaggers)
    backersTokens = [];
    for (let i = 1; i <= 6; i++) {
      const { token } = await loginUser({
        name: `Backer ${i}`,
        email: `backer${i}@fundora.com`,
        role: 'backer',
      });
      backersTokens.push(token);
    }
  });

  it('[BOUNDARY] campaign with 4 flags should remain ACTIVE (below threshold)', async () => {
    // Submit exactly 4 flags
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${backersTokens[i]}`)
        .send(validFlagBody(creatorCampaignId));

      expect(res.statusCode).toBe(201);
    }

    const campaign = await Campaign.findById(creatorCampaignId);

    expect(campaign.activeFlagCount).toBe(4);
    expect(campaign.status).toBe('active'); // Must NOT be suspended yet
  });

  it('[BOUNDARY] campaign should be SUSPENDED at EXACTLY the 5th flag', async () => {
    // Submit exactly 5 flags from 5 different backers
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${backersTokens[i]}`)
        .send(validFlagBody(creatorCampaignId));

      expect(res.statusCode).toBe(201);
    }

    const campaign = await Campaign.findById(creatorCampaignId);

    // KEY ASSERTION: at exactly 5 flags, campaign must be suspended
    expect(campaign.activeFlagCount).toBe(5);
    expect(campaign.status).toBe('suspended');
  });

  it('[BOUNDARY] suspending email should have been sent when campaign hits 5 flags', async () => {
    const { sendCreatorWarningEmail } = require('../utils/emailService');

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${backersTokens[i]}`)
        .send(validFlagBody(creatorCampaignId));
    }

    // The auto-suspension warning email must have been triggered
    expect(sendCreatorWarningEmail).toHaveBeenCalled();
    expect(sendCreatorWarningEmail.mock.calls[0][1]).toMatch(/suspension/i);
  });

  it('[EDGE] a 6th flag on an already-suspended campaign should NOT double-suspend', async () => {
    // Flag 5 times to trigger suspension
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${backersTokens[i]}`)
        .send(validFlagBody(creatorCampaignId));
    }

    // Flag a 6th time
    const res = await request(app)
      .post('/api/flags')
      .set('Authorization', `Bearer ${backersTokens[5]}`)
      .send(validFlagBody(creatorCampaignId));


    // 6th flag still succeeds (the flag is created)
    expect(res.statusCode).toBe(201);

    const campaign = await Campaign.findById(creatorCampaignId);
    // Status remains 'suspended', doesn't change to something else
    expect(campaign.status).toBe('suspended');
    expect(campaign.activeFlagCount).toBe(6);
  });
});

// # 
// 3. ADMIN FLAG RESOLUTION
// # 
describe('PATCH /api/flags/admin/:id/resolve - Admin Resolves Flags', () => {
  let adminToken;
  let reporterUser;
  let creatorUser;
  let campaign;
  let flag;

  beforeEach(async () => {
    const { token } = await loginUser({ name: 'Mod Admin', email: 'modadmin@fundora.com', role: 'admin' });
    adminToken = token;

    creatorUser = await createVerifiedUser({ name: 'Flagged Creator', email: 'flaggedcreator@fundora.com', role: 'creator' });
    reporterUser = await createVerifiedUser({ name: 'Flag Reporter', email: 'flagreporter@fundora.com', role: 'backer' });

    campaign = await createActiveCampaign(creatorUser._id, 'To Be Flagged');

    flag = await Flag.create({
      reporter: reporterUser._id,
      campaign: campaign._id,
      reason: 'Fraud/Scam',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.' +
        'does not match any real market listing. Multiple users have confirmed this is a scam operation.',
      status: 'pending',
    });

    // Increment campaign flag count manually (controller does this on create)
    await Campaign.findByIdAndUpdate(campaign._id, { $inc: { activeFlagCount: 1 } });
  });

  // # Uphold Flag
  it('[HAPPY] admin should uphold a flag and warn the creator (1st strike)', async () => {
    const { sendCreatorWarningEmail } = require('../utils/emailService');

    const res = await request(app)
      .patch(`/api/flags/admin/${flag._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resolutionAction: 'warned',
        adminComments: 'Campaign contains misleading information. Creator has been warned.',
      });


    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedFlag = await Flag.findById(flag._id);
    expect(updatedFlag.status).toBe('resolved');
    expect(updatedFlag.resolutionAction).toBe('warned');

    const updatedCreator = await User.findById(creatorUser._id);
    expect(updatedCreator.warningCount).toBe(1);

    // Warning email should be sent
    expect(sendCreatorWarningEmail).toHaveBeenCalled();
  });

  it('[HAPPY] 2nd upheld flag should result in a 7-day suspension for the creator', async () => {
    // Give the creator 1 prior warning
    await User.findByIdAndUpdate(creatorUser._id, { warningCount: 1 });

    await request(app)
      .patch(`/api/flags/admin/${flag._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolutionAction: 'warned', adminComments: 'Second violation.' });

    const updatedCreator = await User.findById(creatorUser._id);
    expect(updatedCreator.warningCount).toBe(2);
    expect(updatedCreator.suspendedUntil).toBeDefined();
    // suspendedUntil must be in the future (~7 days from now)
    const daysUntilSuspension =
      (new Date(updatedCreator.suspendedUntil) - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysUntilSuspension).toBeGreaterThan(5); // slightly less than 7 due to timing
    expect(daysUntilSuspension).toBeLessThanOrEqual(8);
  });

  it('[HAPPY] termination action should ban creator and mark campaign terminated', async () => {
    const { sendCampaignTerminatedEmail } = require('../utils/emailService');

    const res = await request(app)
      .patch(`/api/flags/admin/${flag._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resolutionAction: 'terminated',
        adminComments: 'Campaign is confirmed scam. Creator permanently banned.',
      });


    expect(res.statusCode).toBe(200);

    const updatedCampaign = await Campaign.findById(campaign._id);
    const updatedCreator = await User.findById(creatorUser._id);


    expect(updatedCampaign.status).toBe('terminated');
    expect(updatedCreator.isBanned).toBe(true);
    expect(sendCampaignTerminatedEmail).toHaveBeenCalled();
  });

  // # Dismiss Flag
  it('[HAPPY] admin should dismiss a flag and mark it as dismissed', async () => {
    const res = await request(app)
      .patch(`/api/flags/admin/${flag._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resolutionAction: 'none',
        adminComments: 'Flag is unfounded. Campaign is legitimate.',
        isMalicious: false,
      });


    expect(res.statusCode).toBe(200);

    const updatedFlag = await Flag.findById(flag._id);
    expect(updatedFlag.status).toBe('dismissed');
    expect(updatedFlag.isMalicious).toBe(false);
  });

  it('[HAPPY] dismissing a malicious flag should increment reporter falseFlagCount', async () => {
    const res = await request(app)
      .patch(`/api/flags/admin/${flag._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resolutionAction: 'none',
        adminComments: 'This is a targeted harassment flag against the creator.',
        isMalicious: true,
      });


    expect(res.statusCode).toBe(200);

    const updatedReporter = await User.findById(reporterUser._id);
    expect(updatedReporter.falseFlagCount).toBe(1);
  });

  it('[BOUNDARY] reporter with 3 malicious flags should receive a 30-day flagging restriction', async () => {
    // Pre-set falseFlagCount to 2
    await User.findByIdAndUpdate(reporterUser._id, { falseFlagCount: 2 });

    await request(app)
      .patch(`/api/flags/admin/${flag._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resolutionAction: 'none',
        adminComments: 'Third malicious flag by same reporter.',
        isMalicious: true,
      });

    const updatedReporter = await User.findById(reporterUser._id);

    expect(updatedReporter.falseFlagCount).toBe(3);
    expect(updatedReporter.flaggingRestrictedUntil).toBeDefined();
    // Restriction must be future-dated (~30 days)
    const daysRemaining =
      (new Date(updatedReporter.flaggingRestrictedUntil) - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysRemaining).toBeGreaterThan(25);
    expect(daysRemaining).toBeLessThanOrEqual(31);
  });

  // # Idempotency
  it('[NEGATIVE] should return 400 when trying to resolve an already-resolved flag', async () => {
    // Resolve first time
    await request(app)
      .patch(`/api/flags/admin/${flag._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolutionAction: 'warned', adminComments: 'First resolution.' });

    // Try to resolve again
    const res = await request(app)
      .patch(`/api/flags/admin/${flag._id}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolutionAction: 'terminated', adminComments: 'Second attempt.' });


    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already been resolved/i);
  });

  it('[NEGATIVE] should return 404 for a non-existent flag ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/flags/admin/${fakeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolutionAction: 'warned', adminComments: 'Test.' });


    expect(res.statusCode).toBe(404);
  });

  it('[NEGATIVE] non-admin user should be blocked from resolving flags', async () => {
    const { token: backerToken } = await loginUser({
      name: 'Random Backer',
      email: 'randombacker@fundora.com',
      role: 'backer',
    });

    const res = await request(app)
      .patch(`/api/flags/admin/${flag._id}/resolve`)
      .set('Authorization', `Bearer ${backerToken}`)
      .send({ resolutionAction: 'warned', adminComments: 'Unauthorized attempt.' });


    expect(res.statusCode).toBe(403);
  });
});

// # 
// 4. CAMPAIGN RESTORATION
// # 
describe('PATCH /api/flags/admin/campaigns/:id/restore - Restore Suspended Campaign', () => {
  let adminToken;
  let suspendedCampaignId;
  let reporterUsers;

  beforeEach(async () => {
    const { token } = await loginUser({ name: 'Restore Admin', email: 'restoreadmin@fundora.com', role: 'admin' });
    adminToken = token;

    const creator = await createVerifiedUser({ name: 'Suspended Creator', email: 'supcreator@fundora.com', role: 'creator' });
    const campaign = await Campaign.create({
      creator: creator._id,
      title: 'Suspended Campaign For Restore',
      description:
        'A detailed description of the suspended campaign that needs to be restored by the admin after review.',
      category: 'Technology',
      fundingGoal: 50000,
      currentAmount: 10000,
      duration: 30,
      fundingType: 'donation-based',
      images: [{ url: 'http://cdn.com/img.jpg', publicId: 'p' }],
      status: 'suspended',
      activeFlagCount: 5,
    });
    suspendedCampaignId = campaign._id.toString();

    // Create flags against this campaign
    reporterUsers = [];
    for (let i = 0; i < 5; i++) {
      const reporter = await createVerifiedUser({
        name: `Malicious Reporter ${i}`,
        email: `malrep${i}@fundora.com`,
        role: 'backer',
      });
      reporterUsers.push(reporter);
      await Flag.create({
        reporter: reporter._id,
        campaign: campaign._id,
        reason: 'Spam',
        description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.' +
          'history of submitting false flags against legitimate campaigns on the platform.',
        status: 'pending',
      });
    }
  });

  it('[HAPPY] admin should restore a suspended campaign to active status', async () => {
    const res = await request(app)
      .patch(`/api/flags/admin/campaigns/${suspendedCampaignId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);


    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/restored/i);

    const updatedCampaign = await Campaign.findById(suspendedCampaignId);
    expect(updatedCampaign.status).toBe('active');
    expect(updatedCampaign.activeFlagCount).toBe(0); // reset to 0
  });

  it('[HAPPY] all pending flags should be bulk-dismissed on campaign restoration', async () => {
    await request(app)
      .patch(`/api/flags/admin/campaigns/${suspendedCampaignId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    const pendingFlags = await Flag.find({
      campaign: suspendedCampaignId,
      status: { $in: ['pending', 'under_review'] },
    });

    expect(pendingFlags.length).toBe(0); // all flags should be dismissed

    const dismissedFlags = await Flag.find({
      campaign: suspendedCampaignId,
      status: 'dismissed',
    });
    expect(dismissedFlags.length).toBe(5);
  });

  it('[NEGATIVE] should return 400 when trying to restore an active campaign', async () => {
    // Change the campaign back to active first
    await Campaign.findByIdAndUpdate(suspendedCampaignId, { status: 'active' });

    const res = await request(app)
      .patch(`/api/flags/admin/campaigns/${suspendedCampaignId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);


    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/only suspended campaigns/i);
  });

  it('[NEGATIVE] should return 404 for a non-existent campaign', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/flags/admin/campaigns/${fakeId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);


    expect(res.statusCode).toBe(404);
  });
});

// # 
// 5. ADMIN FLAG LISTING
// # 
describe('GET /api/flags/admin - Admin Flag List', () => {
  let adminToken;

  beforeEach(async () => {
    const { token } = await loginUser({ name: 'List Admin', email: 'listadmin@fundora.com', role: 'admin' });
    adminToken = token;

    const creator = await createVerifiedUser({ name: 'List Creator', email: 'listcreator@fundora.com', role: 'creator' });
    const reporter = await createVerifiedUser({ name: 'List Reporter', email: 'listreporter@fundora.com', role: 'backer' });
    const campaign = await createActiveCampaign(creator._id, 'Listed');

    await Flag.create({
      reporter: reporter._id,
      campaign: campaign._id,
      reason: 'Misleading Information',
      description: 'A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A detailed description easily exceeding the one hundred character minimum validation requirement.' +
        'specifications. Independent verification shows the stated claims are not accurate.',
      status: 'pending',
    });
  });

  it('[HAPPY] admin should retrieve all flags in the moderation panel', async () => {
    const res = await request(app)
      .get('/api/flags/admin')
      .set('Authorization', `Bearer ${adminToken}`);


    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('[HAPPY] should be able to filter flags by status via query param', async () => {
    const res = await request(app)
      .get('/api/flags/admin?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);


    expect(res.statusCode).toBe(200);
    res.body.data.forEach((f) => expect(f.status).toBe('pending'));
  });

  it('[NEGATIVE] non-admin should receive 403 when listing admin flags', async () => {
    const { token } = await loginUser({ name: 'Regular Backer', email: 'regbacker@fundora.com', role: 'backer' });

    const res = await request(app)
      .get('/api/flags/admin')
      .set('Authorization', `Bearer ${token}`);


    expect(res.statusCode).toBe(403);
  });
});
