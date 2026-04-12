// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'testpass123';
process.env.DB_PATH = ':memory:';
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.TELEGRAM_ADMIN_ID = '123456789';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'testpass';
process.env.EMAIL_FROM = 'test@test.com';

const { db, initDatabase } = require('../db');

// Mock dependencies
jest.mock('node-cron', () => ({
  schedule: jest.fn((pattern, callback) => {
    return { stop: jest.fn() };
  })
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  }))
}));

// Mock fetch for Telegram API
global.fetch = jest.fn();

// Import notifier AFTER setting up environment and mocks
let notifier;

describe('Notifier Service', () => {
  let authToken;
  let testListId;
  let testTaskId;

  beforeAll(() => {
    // Initialize database and notifier
    initDatabase();
    notifier = require('../services/notifier');
    
    // Create test user and list
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync('testpass123', 10);
    db.prepare('INSERT OR REPLACE INTO users (id, username, password_hash, email, telegram_id) VALUES (?, ?, ?, ?, ?)')
      .run(1, 'testadmin', passwordHash, 'test@example.com', '123456789');
    
    const listResult = db.prepare('INSERT INTO lists (name, user_id, sort_order) VALUES (?, ?, ?)')
      .run('Test List', 1, 1);
    testListId = listResult.lastInsertRowid;
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('initEmailTransporter', () => {
    test('should initialize email transporter when SMTP is configured', () => {
      expect(() => notifier.initEmailTransporter()).not.toThrow();
    });
  });

  describe('startReminderScheduler', () => {
    test('should start cron scheduler', () => {
      expect(() => notifier.startReminderScheduler()).not.toThrow();
    });
  });

  describe('sendTelegramNotification', () => {
    test('should send Telegram notification successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ ok: true, result: {} })
      });

      const result = await notifier.sendTelegramNotification('123456789', 'Test message');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/sendMessage',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test message')
        })
      );
      expect(result).toBe(true);
    });

    test('should handle Telegram API error', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ ok: false, description: 'Bad Request' })
      });

      const result = await notifier.sendTelegramNotification('123456789', 'Test message');
      expect(result).toBe(false);
    });

    test('should handle network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await notifier.sendTelegramNotification('123456789', 'Test message');
      expect(result).toBe(false);
    });

    test('should return false when bot token not configured', async () => {
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;

      // Clear cache and re-require
      jest.resetModules();
      const notifierNoToken = require('../services/notifier');
      
      const result = await notifierNoToken.sendTelegramNotification('123456789', 'Test');
      expect(result).toBe(false);

      process.env.TELEGRAM_BOT_TOKEN = originalToken;
    });
  });

  describe('sendEmailNotification', () => {
    test('should send email notification', async () => {
      const result = await notifier.sendEmailNotification(
        'test@example.com',
        'Test Subject',
        'Test message'
      );
      expect(result).toBe(true);
    });

    test('should return false when email is null', async () => {
      const result = await notifier.sendEmailNotification(null, 'Subject', 'Message');
      expect(result).toBe(false);
    });
  });

  describe('sendTestNotification', () => {
    test('should send test notifications to both Telegram and Email', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ ok: true })
      });

      const results = await notifier.sendTestNotification('123456789', 'test@example.com');
      
      expect(results).toHaveProperty('telegram');
      expect(results).toHaveProperty('email');
    });

    test('should send only Telegram notification when email is not provided', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ ok: true })
      });

      const results = await notifier.sendTestNotification('123456789', null);
      
      expect(results).toHaveProperty('telegram');
      expect(results).not.toHaveProperty('email');
    });

    test('should send only Email notification when telegram_id is not provided', async () => {
      const results = await notifier.sendTestNotification(null, 'test@example.com');
      
      expect(results).not.toHaveProperty('telegram');
      expect(results).toHaveProperty('email');
    });
  });

  describe('checkReminders', () => {
    beforeEach(() => {
      // Create a task with reminder due in 30 minutes
      const now = new Date();
      const dueDate = new Date(now.getTime() + 30 * 60 * 1000);
      
      const result = db.prepare(`
        INSERT INTO tasks (list_id, title, due_date, reminder_minutes, reminder_sent, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testListId, 'Reminder Task', dueDate.toISOString(), 30, 0, 1);
      testTaskId = result.lastInsertRowid;
    });

    afterEach(() => {
      // Clean up tasks
      db.prepare('DELETE FROM tasks WHERE id = ?').run(testTaskId);
    });

    test('should check for upcoming reminders', async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ ok: true })
      });

      await expect(notifier.checkReminders()).resolves.not.toThrow();
    });

    test('should handle tasks without reminders', async () => {
      // Delete reminder task and create one without reminder
      db.prepare('DELETE FROM tasks WHERE id = ?').run(testTaskId);
      db.prepare(`
        INSERT INTO tasks (list_id, title, sort_order)
        VALUES (?, ?, ?)
      `).run(testListId, 'No Reminder Task', 2);

      await expect(notifier.checkReminders()).resolves.not.toThrow();
    });
  });
});
