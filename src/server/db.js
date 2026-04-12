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
}

module.exports = { db, initDatabase };
