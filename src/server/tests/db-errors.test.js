// Test error paths by mocking database failures
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'testpass123';
process.env.DB_PATH = ':memory:';

const { db, initDatabase } = require('../db');

// Get valid token first
const jwt = require('jsonwebtoken');
const validToken = jwt.sign({ id: 1, username: 'testadmin' }, 'test-secret-key', { expiresIn: '7d' });

// Create a proxy that can throw on demand
let shouldThrow = false;
let throwMessage = 'Database error';

const originalPrepare = db.prepare.bind(db);
db.prepare = function(sql) {
  const stmt = originalPrepare(sql);
  const originalGet = stmt.get.bind(stmt);
  const originalAll = stmt.all.bind(stmt);
  const originalRun = stmt.run.bind(stmt);
  
  stmt.get = function(...args) {
    if (shouldThrow) throw new Error(throwMessage);
    return originalGet(...args);
  };
  
  stmt.all = function(...args) {
    if (shouldThrow) throw new Error(throwMessage);
    return originalAll(...args);
  };
  
  stmt.run = function(...args) {
    if (shouldThrow) throw new Error(throwMessage);
    return originalRun(...args);
  };
  
  return stmt;
};

const request = require('supertest');
const app = require('../index');

describe('Database Error Handling', () => {
  
  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    shouldThrow = false;
    throwMessage = 'Database error';
  });

  describe('Auth Routes Error Handling', () => {
    test('Login should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: 'testpass123' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });

    test('GET /api/auth/me should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(500);
    });

    test('PUT /api/auth/profile should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(500);
    });

    test('PUT /api/auth/password should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ currentPassword: 'testpass123', newPassword: 'newpass' });
      expect(res.status).toBe(500);
    });
  });

  describe('Lists Routes Error Handling', () => {
    test('GET /api/lists should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .get('/api/lists')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(500);
    });

    test('POST /api/lists should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Test List' });
      expect(res.status).toBe(500);
    });

    test('PUT /api/lists/:id should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .put('/api/lists/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Updated' });
      expect(res.status).toBe(500);
    });

    test('PUT /api/lists/batch/reorder should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .put('/api/lists/batch/reorder')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ orders: [{ id: 1, sort_order: 0 }] });
      expect(res.status).toBe(500);
    });

    test('DELETE /api/lists/:id should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .delete('/api/lists/1')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(500);
    });
  });

  describe('Tasks Routes Error Handling', () => {
    test('GET /api/tasks should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(500);
    });

    test('GET /api/tasks/:id should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .get('/api/tasks/1')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(500);
    });

    test('POST /api/tasks should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ list_id: 1, title: 'Test' });
      expect(res.status).toBe(500);
    });

    test('PUT /api/tasks/:id should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .put('/api/tasks/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(500);
    });

    test('PUT /api/tasks/batch/reorder should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .put('/api/tasks/batch/reorder')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ tasks: [{ id: 1, list_id: 1, sort_order: 0 }] });
      expect(res.status).toBe(500);
    });

    test('DELETE /api/tasks/:id should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .delete('/api/tasks/1')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(500);
    });

    test('POST /api/tasks/:id/toggle should handle database error', async () => {
      shouldThrow = true;
      const res = await request(app)
        .post('/api/tasks/1/toggle')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(500);
    });
  });
});
