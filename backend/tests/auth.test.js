/**
 * ============================================================
 * Fundora - Auth & OTP Flow Tests
 * ============================================================
 * Covers:
 *  - User Registration (happy path, duplicate, missing fields)
 *  - OTP Verification (valid, invalid, expired, missing)
 *  - OTP Resend
 *  - Login (verified, unverified, wrong credentials, banned)
 *  - JWT Token Refresh & Logout
 *  - JWT Guard (missing token, malformed token, wrong secret)
 * ============================================================
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const { connectTestDB, closeTestDB, clearTestDB } = require('./setup');

// ─── Mock email service so no real emails are sent ───────────────────────────
jest.mock('../utils/emailService', () => ({
  generateOTP: jest.fn(() => '123456'), // always return predictable OTP
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendReceiptEmail: jest.fn().mockResolvedValue(true),
}));

// ─── Lifecycle ───────────────────────────────────────────────────────────────
beforeAll(async () => {
  await connectTestDB();

  // Ensure required env vars are set for JWT helpers
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
  // Reset mock call counts between tests
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────
const registerUser = (overrides = {}) =>
  request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'test@fundora.com',
      password: 'Password123!',
      role: 'backer',
      ...overrides,
    });

// ═════════════════════════════════════════════════════════════════════════════
// 1. REGISTRATION
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  // ── Happy Path ─────────────────────────────────────────────────────────────
  it('[HAPPY] should register a new user and return 201 with user data (no token)', async () => {
    const res = await registerUser();


    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.email).toBe('test@fundora.com');
    expect(res.body.isVerified).toBe(false);
    // Critical ─ user must NOT receive a token before OTP verification
    expect(res.body).not.toHaveProperty('token');
    expect(res.body.message).toMatch(/verify your email/i);
  });

  it('[HAPPY] should store the OTP in the database after registration', async () => {
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });


    expect(dbUser).not.toBeNull();
    expect(dbUser.otp).toBeDefined();
    expect(dbUser.otp.code).toBeDefined();
    expect(dbUser.otp.expiresAt).toBeInstanceOf(Date);
    // OTP must expire in the future
    expect(new Date(dbUser.otp.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('[HAPPY] should hash the password before saving to DB', async () => {
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    // Password in DB must never equal the plain-text password
    expect(dbUser.password).not.toBe('Password123!');
    expect(dbUser.password).toMatch(/^\$2/); // bcrypt hash prefix
  });

  it('[HAPPY] should call sendOTPEmail once during registration', async () => {
    const { sendOTPEmail } = require('../utils/emailService');
    await registerUser();
    expect(sendOTPEmail).toHaveBeenCalledTimes(1);
  });

  // ── Negative / Failure Cases ───────────────────────────────────────────────
  it('[NEGATIVE] should return 400 if email is already registered', async () => {
    await registerUser();
    const res = await registerUser(); // second attempt, same email


    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('[NEGATIVE] should return 500 when name is missing (Mongoose validation error)', async () => {
    const res = await registerUser({ name: undefined });


    // Mongoose ValidationError → caught by server error handler → 500
    expect([400, 500]).toContain(res.statusCode);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. OTP VERIFICATION
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/otp/verify', () => {
  // ── Happy Path ─────────────────────────────────────────────────────────────
  it('[HAPPY] should verify OTP, mark user as verified, and return JWT tokens', async () => {
    // Arrange: register a user first
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    const correctOtp = dbUser.otp.code;

    // Act
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: correctOtp });


    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body.isVerified).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.message).toMatch(/verified successfully/i);
  });

  it('[HAPPY] should clear the OTP from DB after successful verification', async () => {
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: dbUser.otp.code });

    const afterUser = await User.findOne({ email: 'test@fundora.com' });
    // OTP must be cleared after verification (security requirement)
    expect(afterUser.otp?.code).toBeUndefined();
    expect(afterUser.isVerified).toBe(true);
  });

  // ── Negative Cases ─────────────────────────────────────────────────────────
  it('[NEGATIVE] should return 400 for an incorrect OTP', async () => {
    await registerUser();
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: '000000' }); // wrong OTP


    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid otp/i);
  });

  it('[NEGATIVE] should return 400 if OTP fields are missing', async () => {
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com' }); // missing otp field


    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  it('[NEGATIVE] should return 404 for a non-existent email', async () => {
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: 'ghost@fundora.com', otp: '123456' });


    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });

  it('[NEGATIVE] should return 400 if user is already verified', async () => {
    // Arrange: register & verify
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: dbUser.otp.code });

    // Act: try to verify again
    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: '123456' });


    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already verified/i);
  });

  // ── Failure / Expired OTP ──────────────────────────────────────────────────
  it('[FAILURE] should return 400 and clear OTP when it has expired', async () => {
    // Arrange: create user with expired OTP
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Expired User', email: 'expired@fundora.com', password: 'Pass123!', role: 'backer' });

    // Manually backdate the OTP expiry in DB
    await User.updateOne(
      { email: 'expired@fundora.com' },
      { $set: { 'otp.expiresAt': new Date(Date.now() - 1000) } } // expired 1 sec ago
    );

    const res = await request(app)
      .post('/api/otp/verify')
      .send({ email: 'expired@fundora.com', otp: '123456' });


    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/expired/i);

    // OTP must also be cleared after expiry detection
    const afterUser = await User.findOne({ email: 'expired@fundora.com' });
    expect(afterUser.otp?.code).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. OTP RESEND
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/otp/resend', () => {
  it('[HAPPY] should resend OTP and update the expiry time in DB', async () => {
    const { sendOTPEmail } = require('../utils/emailService');
    await registerUser();

    const beforeUser = await User.findOne({ email: 'test@fundora.com' });
    const beforeExpiry = beforeUser.otp.expiresAt;

    // Small delay so timestamps differ
    await new Promise((r) => setTimeout(r, 50));

    const res = await request(app)
      .post('/api/otp/resend')
      .send({ email: 'test@fundora.com' });


    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/sent successfully/i);

    const afterUser = await User.findOne({ email: 'test@fundora.com' });
    // New token must have been issued (expiry refreshed)
    expect(new Date(afterUser.otp.expiresAt).getTime()).toBeGreaterThanOrEqual(
      new Date(beforeExpiry).getTime()
    );
    expect(sendOTPEmail).toHaveBeenCalledTimes(2); // once on register, once on resend
  });

  it('[NEGATIVE] should return 400 if user is already verified', async () => {
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: dbUser.otp.code });

    const res = await request(app)
      .post('/api/otp/resend')
      .send({ email: 'test@fundora.com' });


    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already verified/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. LOGIN
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  // ── Setup: register + verify a user ───────────────────────────────────────
  beforeEach(async () => {
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: dbUser.otp.code });
  });

  // ── Happy Path ─────────────────────────────────────────────────────────────
  it('[HAPPY] should login a verified user and return accessToken + refreshToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@fundora.com', password: 'Password123!' });


    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.email).toBe('test@fundora.com');
    expect(res.body).not.toHaveProperty('password');
  });

  it('[HAPPY] should save refreshToken to DB on successful login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@fundora.com', password: 'Password123!' });

    const dbUser = await User.findOne({ email: 'test@fundora.com' });

    expect(dbUser.refreshToken).toContain(res.body.refreshToken);
  });

  it('[HAPPY] should keep only the last 5 refresh tokens (rotation policy)', async () => {
    // Login 6 times to exceed the limit
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@fundora.com', password: 'Password123!' });
    }
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    expect(dbUser.refreshToken.length).toBeLessThanOrEqual(5);
  });

  // ── Negative Cases ─────────────────────────────────────────────────────────
  it('[NEGATIVE] should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@fundora.com', password: 'WrongPass999!' });


    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('[NEGATIVE] should return 401 for non-existing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@fundora.com', password: 'Password123!' });


    expect(res.statusCode).toBe(401);
  });

  it('[EDGE] should still return 200 even if sendOTPEmail failed on register (email failure resilience)', async () => {
    const { sendOTPEmail } = require('../utils/emailService');
    sendOTPEmail.mockRejectedValueOnce(new Error('SMTP failure'));

    const res = await request(app).post('/api/auth/register').send({
      name: 'Email Failure User',
      email: 'emailfail@fundora.com',
      password: 'Pass123!',
      role: 'backer',
    });


    // Registration should succeed even if email fails
    expect(res.statusCode).toBe(201);
    const dbUser = await User.findOne({ email: 'emailfail@fundora.com' });
    expect(dbUser).not.toBeNull();
  });

  // ── Banned / Suspended User ────────────────────────────────────────────────
  it('[FAILURE] should return 403 for a permanently banned user making a protected request', async () => {
    // Ban the user
    await User.findOneAndUpdate(
      { email: 'test@fundora.com' },
      { isBanned: true }
    );

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@fundora.com', password: 'Password123!' });

    // Login itself works (controller doesn't check ban); the middleware does.
    // Try to hit a protected route with their token.
    const token = loginRes.body.token;
    const protectedRes = await request(app)
      .get('/api/campaigns/my')
      .set('Authorization', `Bearer ${token}`);


    expect(protectedRes.statusCode).toBe(403);
    expect(protectedRes.body.message).toMatch(/permanently banned/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. TOKEN REFRESH
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/refresh', () => {
  let validRefreshToken;

  beforeEach(async () => {
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: dbUser.otp.code });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@fundora.com', password: 'Password123!' });

    validRefreshToken = loginRes.body.refreshToken;
  });

  it('[HAPPY] should return a new accessToken given a valid refreshToken', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: validRefreshToken });


    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('[NEGATIVE] should return 401 if refreshToken is missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});


    expect(res.statusCode).toBe(401);
  });

  it('[NEGATIVE] should return 403 for an invalid / tampered refreshToken', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'tampered.invalid.token' });


    expect(res.statusCode).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. JWT GUARD (Auth Middleware)
// ═════════════════════════════════════════════════════════════════════════════
describe('JWT Guard - Protected Route Access', () => {
  it('[NEGATIVE] should return 401 when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/campaigns/my');


    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('[NEGATIVE] should return 401 for a malformed Bearer token', async () => {
    const res = await request(app)
      .get('/api/campaigns/my')
      .set('Authorization', 'Bearer this_is_not_a_valid_jwt');


    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/token failed/i);
  });

  it('[NEGATIVE] should return 401 for a token signed with the wrong secret', async () => {
    const jwt = require('jsonwebtoken');
    const fakeToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, 'wrong_secret_entirely');

    const res = await request(app)
      .get('/api/campaigns/my')
      .set('Authorization', `Bearer ${fakeToken}`);


    expect(res.statusCode).toBe(401);
  });

  it('[NEGATIVE] should return 403 for a non-admin user hitting an admin-only route', async () => {
    // Register, verify, login as backer
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: dbUser.otp.code });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@fundora.com', password: 'Password123!' });

    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/admin/campaigns/pending')
      .set('Authorization', `Bearer ${token}`);


    expect(res.statusCode).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. LOGOUT
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/logout', () => {
  it('[HAPPY] should remove the refreshToken from the DB on logout', async () => {
    await registerUser();
    const dbUser = await User.findOne({ email: 'test@fundora.com' });
    await request(app)
      .post('/api/otp/verify')
      .send({ email: 'test@fundora.com', otp: dbUser.otp.code });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@fundora.com', password: 'Password123!' });

    const { refreshToken } = loginRes.body;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });


    expect(logoutRes.statusCode).toBe(204);

    const afterUser = await User.findOne({ email: 'test@fundora.com' });
    expect(afterUser.refreshToken).not.toContain(refreshToken);
  });

  it('[EDGE] should return 204 gracefully if no refreshToken body is provided', async () => {
    const res = await request(app).post('/api/auth/logout').send({});


    expect(res.statusCode).toBe(204);
  });
});
