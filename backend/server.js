require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const otpRoutes = require('./routes/otp');
const passwordRoutes = require('./routes/password');
const campaignRoutes = require('./routes/campaigns');
const milestoneRoutes = require('./routes/milestone');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const notificationRoutes = require('./routes/notification');
const flagRoutes = require('./routes/flagRoutes');
const financeRoutes = require('./routes/finance');
const messageRoutes = require('./routes/messages');
const dashboardRoutes = require('./routes/dashboard');
const { Server } = require('socket.io');
const { initializeSocket } = require('./utils/socketHandlers');
const { startCronJobs } = require('./utils/cronJobs');

const app = express();

// Connect to Database
connectDB();

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/campaigns', milestoneRoutes); // Milestone routes nested under campaigns
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Fundora API is running...');
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
initializeSocket(io);

// Start Background Jobs
startCronJobs();

// Increase timeout for large file uploads (2 minutes)
server.timeout = 120000;
server.keepAliveTimeout = 120000;

// Handle connection errors gracefully (prevent ECONNRESET crashes)
server.on('clientError', (err, socket) => {
  console.error('Client connection error:', err.message);
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
});

// Global error handlers to prevent process crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - just log and continue
});
