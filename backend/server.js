require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const otpRoutes = require('./routes/otp');
const passwordRoutes = require('./routes/password');
const campaignRoutes = require('./routes/campaigns');
const adminRoutes = require('./routes/admin');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/admin', adminRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Fundora API is running...');
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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
