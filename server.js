const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const cron = require('node-cron');

// Import jobs
const { fetchDailyMatches } = require('./jobs/fetchMatches');
const { analyzeMatches } = require('./jobs/analyzeMatches');
const { trackResults } = require('./jobs/resultTracker');
const { cleanupOldMatches } = require('./jobs/cleanupMatches');

// Import routes
const matchRoutes = require('./routes/matches');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const predictionRoutes = require('./routes/predictions');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 10000;

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ─── MONGODB CONNECTION ─────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};
connectDB();

// ─── ROUTES ─────────────────────────────────────────────────
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/notifications', notificationRoutes);

// Public pages
app.get('/', (req, res) => res.render('index'));
app.get('/admin', (req, res) => res.render('admin'));
app.get('/login', (req, res) => res.render('login'));
app.get('/history', (req, res) => res.render('history'));
app.get('/stats', (req, res) => res.render('stats'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// ─── AUTOMATED CRON JOBS ────────────────────────────────────

const runDailyJob = async () => {
  console.log('🔄 [CRON] Running daily match fetch and analysis...');
  try {
    const matches = await fetchDailyMatches();
    console.log(`📊 Fetched ${matches.length} matches`);
    const analyzed = await analyzeMatches(matches);
    console.log(`✅ Analyzed ${analyzed.length} matches`);
  } catch (err) {
    console.error('❌ Daily job error:', err.message);
  }
};

const runResultTracker = async () => {
  console.log('🔄 [CRON] Tracking match results...');
  try {
    await trackResults();
  } catch (err) {
    console.error('❌ Result tracker error:', err.message);
  }
};

const runCleanup = async () => {
  console.log('🔄 [CRON] Cleaning up old matches...');
  try {
    const deleted = await cleanupOldMatches();
    console.log(`🗑️ Cleaned up ${deleted} old matches`);
  } catch (err) {
    console.error('❌ Cleanup error:', err.message);
  }
};

// Schedule: Daily fetch at 00:05 UTC
cron.schedule('5 0 * * *', runDailyJob, { timezone: 'UTC' });

// Schedule: Result tracker every 30 minutes
cron.schedule('*/30 * * * *', runResultTracker, { timezone: 'UTC' });

// Schedule: Cleanup every hour
cron.schedule('0 * * * *', runCleanup, { timezone: 'UTC' });

// Run on startup (with delays to avoid conflicts)
setTimeout(runDailyJob, 5000);
setTimeout(runResultTracker, 15000);
setTimeout(runCleanup, 25000);

// ─── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     🏆 Football AI Server Running            ║');
  console.log(`║     Port: ${PORT}                              ║`);
  console.log(`║     Env:  ${process.env.NODE_ENV || 'development'}                         ║`);
  console.log('║                                              ║');
  console.log('║     Jobs:                                    ║');
  console.log('║     • Daily Fetch: 00:05 UTC                 ║');
  console.log('║     • Result Tracker: Every 30 min         ║');
  console.log('║     • Cleanup: Every hour                    ║');
  console.log('╚══════════════════════════════════════════════╝');
});

module.exports = app;
