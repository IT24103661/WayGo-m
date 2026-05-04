const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors({
  origin: 'https://your-frontend-name.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// Register all models FIRST before routes
require('./models/User');
require('./models/Tour');
require('./models/Vehicle');
require('./models/Booking');
require('./models/TourPackage');
require('./models/CustomQuote');
require('./models/Review');
require('./models/SupportRequest');
require('./models/FleetNotification');
require('./models/TouristNotification');
require('./models/StayInventory');
require('./models/PlatformConfig');
require('./models/RefundRequest');
require('./models/AdminBan');
require('./models/AdminAuditLog');
const DriverSalary = require('./models/DriverSalary');

// Routes
const authRoutes = require('./routes/authRoutes');
const tourManagerRoutes = require('./routes/tourManagerRoutes');
const driverRoutes = require('./routes/driverRoutes');
const fleetManagerRoutes = require('./routes/fleetManagerRoutes');
const touristRoutes = require('./routes/touristRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/users', authRoutes);
app.use('/api/tourmanager', tourManagerRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/fleetmanager', fleetManagerRoutes);
app.use('/api/tourist', touristRoutes);
app.use('/api/admin', adminRoutes);

// Keep API responses consistently JSON to avoid frontend parse crashes.
app.use('/api', (req, res) => {
  return res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
  }
  return next(err);
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryMongoError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('enotfound')
    || message.includes('querysrv')
    || message.includes('eai_again')
    || message.includes('timed out');
};

const connectWithRetry = async (maxAttempts = 5) => {
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { family: 4 });
      return;
    } catch (error) {
      const canRetry = shouldRetryMongoError(error) && attempt < maxAttempts;
      if (!canRetry) throw error;

      console.warn(`⚠️ MongoDB connect attempt ${attempt} failed: ${error.message}`);
      await wait(2000 * attempt);
      attempt += 1;
    }
  }
};

const startServer = async () => {
  try {
    await connectWithRetry();
    console.log('✅ MongoDB Connected!');
    console.log(`   Database: ${mongoose.connection.name}`);

    DriverSalary.syncIndexes().catch((error) => {
      console.warn('⚠️ DriverSalary index sync warning:', error.message);
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port: ${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

startServer();

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => console.log('🔄 MongoDB reconnected'));
