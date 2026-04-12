// Set test environment BEFORE any imports
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./db');
const { initEmailTransporter, startReminderScheduler } = require('./services/notifier');

const isTestMode = process.env.NODE_ENV === 'test';

// Import routes
const authRoutes = require('./routes/auth');
const listsRoutes = require('./routes/lists');
const tasksRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/tasks', tasksRoutes);

// Notification test endpoint
app.post('/api/test-notification', async (req, res) => {
  const { sendTestNotification } = require('./services/notifier');
  const { telegram_id, email } = req.body;
  
  const results = await sendTestNotification(telegram_id, email);
  res.json(results);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database (always)
initDatabase();
if (!isTestMode) {
  initEmailTransporter();
}

// Only start server if this is the main module (not imported for testing)
if (require.main === module) {
  // Start reminder scheduler
  if (!isTestMode) {
    startReminderScheduler();
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 MyTODO server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  });
}

module.exports = app; // For testing
