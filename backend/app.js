// backend/app.js
// Separate Express app (no DB connection, no server.listen) - used by tests
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/user');
const otpRoutes          = require('./routes/otp');
const passwordRoutes     = require('./routes/password');
const campaignRoutes     = require('./routes/campaigns');
const milestoneRoutes    = require('./routes/milestone');
const adminRoutes        = require('./routes/admin');
const paymentRoutes      = require('./routes/payment');
const notificationRoutes = require('./routes/notification');
const flagRoutes         = require('./routes/flagRoutes');
const financeRoutes      = require('./routes/finance');
const messageRoutes      = require('./routes/messages');
const dashboardRoutes    = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/otp',           otpRoutes);
app.use('/api/password',      passwordRoutes);
app.use('/api/campaigns',     campaignRoutes);
app.use('/api/campaigns',     milestoneRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/payment',       paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/flags',         flagRoutes);
app.use('/api/finances',      financeRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/dashboard',     dashboardRoutes);

app.get('/', (req, res) => res.send('Fundora Test API'));

module.exports = app;
