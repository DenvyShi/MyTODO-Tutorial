const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Support in-memory database for testing
const dbPath = process.env.DB_PATH || path.join(__dirname, 'mytodo.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      telegram_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Lists table
  db.exec(`
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'List',
      user_id INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tasks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATETIME,
      priority INTEGER DEFAULT 2,
      completed INTEGER DEFAULT 0,
      reminder_minutes INTEGER,
      reminder_sent INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    )
  `);

  // Check if icon column exists, add if not
  try {
    db.exec('ALTER TABLE lists ADD COLUMN icon TEXT DEFAULT "List"');
  } catch (e) {
    // Column already exists, ignore
  }

  // Create default admin if not exists
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
  
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(adminUsername, passwordHash);
    
    // Create default list for admin
    const userId = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername).id;
    db.prepare('INSERT INTO lists (name, icon, user_id, sort_order) VALUES (?, ?, ?, ?)').run('我的任務', 'ListTodo', userId, 0);
    db.prepare('INSERT INTO lists (name, icon, user_id, sort_order) VALUES (?, ?, ?, ?)').run('工作', 'Briefcase', userId, 1);
    db.prepare('INSERT INTO lists (name, icon, user_id, sort_order) VALUES (?, ?, ?, ?)').run('個人', 'User', userId, 2);
    
    console.log(`✅ Created admin user: ${adminUsername}`);
  }

  // Create default guest account for tutorial visitors
  const guestUsername = 'guest';
  const guestPassword = 'guest';
  
  const existingGuest = db.prepare('SELECT id FROM users WHERE username = ?').get(guestUsername);
  
  if (!existingGuest) {
    const passwordHash = bcrypt.hashSync(guestPassword, 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(guestUsername, passwordHash);
    
    // Create demo lists for guest
    const userId = db.prepare('SELECT id FROM users WHERE username = ?').get(guestUsername).id;
    db.prepare('INSERT INTO lists (name, icon, user_id, sort_order) VALUES (?, ?, ?, ?)').run('📚 教學範例', 'BookOpen', userId, 0);
    db.prepare('INSERT INTO lists (name, icon, user_id, sort_order) VALUES (?, ?, ?, ?)').run('🎯 試試看', 'Target', userId, 1);
    db.prepare('INSERT INTO lists (name, icon, user_id, sort_order) VALUES (?, ?, ?, ?)').run('💡 我的想法', 'Lightbulb', userId, 2);
    
    // Create demo tasks for guest
    const list1 = db.prepare('SELECT id FROM lists WHERE user_id = ? AND sort_order = 0').get(userId).id;
    const list2 = db.prepare('SELECT id FROM lists WHERE user_id = ? AND sort_order = 1').get(userId).id;
    
    db.prepare('INSERT INTO tasks (list_id, title, description, priority, sort_order) VALUES (?, ?, ?, ?, ?)').run(list1, '歡迎來到 MyTODO！', '這是一個由 AI 輔助開發的待辦事項應用教學專案', 1, 0);
    db.prepare('INSERT INTO tasks (list_id, title, description, priority, sort_order) VALUES (?, ?, ?, ?, ?)').run(list1, '試著拖拽這個任務', '你可以拖拽任務來重新排序', 2, 1);
    db.prepare('INSERT INTO tasks (list_id, title, description, priority, sort_order) VALUES (?, ?, ?, ?, ?)').run(list2, '點擊我來編輯', '試試修改標題或加上描述', 2, 0);
    db.prepare('INSERT INTO tasks (list_id, title, description, priority, completed, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(list2, '已完成的任務', '勾選就能完成任務！', 3, 1, 1);
    
    console.log(`✅ Created guest user: ${guestUsername}`);
  }
}

module.exports = { db, initDatabase };
