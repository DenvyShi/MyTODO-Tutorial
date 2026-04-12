const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { db } = require('../db');

// Telegram Bot API
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID;

// Email transporter
let emailTransporter = null;

function initEmailTransporter() {
  if (!process.env.SMTP_HOST) {
    console.log('⚠️  Email SMTP not configured, email notifications disabled');
    return;
  }
  
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  console.log('✅ Email transporter configured');
}

// Send Telegram notification
async function sendTelegramNotification(telegramId, message) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('⚠️  Telegram bot not configured');
    return false;
  }
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );
    
    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram error:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Telegram notification error:', err);
    return false;
  }
}

// Send Email notification
async function sendEmailNotification(email, subject, message) {
  if (!emailTransporter || !email) {
    return false;
  }
  
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: subject,
      text: message,
      html: message.replace(/\n/g, '<br>')
    });
    return true;
  } catch (err) {
    console.error('Email notification error:', err);
    return false;
  }
}

// Format task reminder
function formatTaskReminder(task, minutesUntil) {
  const dueStr = task.due_date ? new Date(task.due_date).toLocaleString('zh-TW') : '無截止時間';
  
  return `⏰ <b>任務提醒</b>

📋 <b>${task.title}</b>
${task.description ? `📝 ${task.description}\n` : ''}
📅 截止時間: ${dueStr}
⏱️ 還有 ${minutesUntil} 分鐘

<a href="${process.env.APP_URL || 'http://localhost:5173'}">打開 MyTODO</a>`;
}

// Check for upcoming tasks and send reminders
async function checkReminders() {
  console.log('🔍 Checking for task reminders...');
  
  // Get tasks with reminders due in the next hour that haven't been sent
  const now = new Date();
  
  const tasks = db.prepare(`
    SELECT t.*, u.telegram_id, u.email
    FROM tasks t
    JOIN lists l ON t.list_id = l.id
    JOIN users u ON l.user_id = u.id
    WHERE t.completed = 0
      AND t.due_date IS NOT NULL
      AND t.reminder_minutes IS NOT NULL
      AND t.reminder_sent = 0
  `).all();
  
  for (const task of tasks) {
    const dueDate = new Date(task.due_date);
    const reminderTime = new Date(dueDate.getTime() - task.reminder_minutes * 60 * 1000);
    
    // Check if it's time to send reminder (within 1 minute window)
    const diff = (reminderTime - now) / 1000 / 60;
    
    if (diff >= -1 && diff <= 1) {
      const message = formatTaskReminder(task, task.reminder_minutes);
      
      // Send Telegram notification
      if (task.telegram_id) {
        await sendTelegramNotification(task.telegram_id, message);
      }
      
      // Send Email notification
      if (task.email) {
        await sendEmailNotification(
          task.email,
          `任務提醒: ${task.title}`,
          message.replace(/<[^>]*>/g, '').replace(/<br>/g, '\n')
        );
      }
      
      // Mark reminder as sent
      db.prepare('UPDATE tasks SET reminder_sent = 1 WHERE id = ?').run(task.id);
      console.log(`✅ Reminder sent for task: ${task.title}`);
    }
  }
}

// Start reminder scheduler
function startReminderScheduler() {
  // Check every minute
  cron.schedule('* * * * *', checkReminders);
  console.log('✅ Reminder scheduler started (checking every minute)');
}

// Manual notification for testing
async function sendTestNotification(telegramId, email) {
  const testMessage = `🧪 <b>MyTODO 測試通知</b>

這是一封測試通知，如果你收到這個訊息，表示通知功能正常運作！

時間: ${new Date().toLocaleString('zh-TW')}`;
  
  const results = {};
  
  if (telegramId) {
    results.telegram = await sendTelegramNotification(telegramId, testMessage);
  }
  
  if (email) {
    results.email = await sendEmailNotification(email, 'MyTODO 測試通知', testMessage.replace(/<[^>]*>/g, ''));
  }
  
  return results;
}

module.exports = {
  initEmailTransporter,
  startReminderScheduler,
  sendTelegramNotification,
  sendEmailNotification,
  sendTestNotification,
  checkReminders
};
