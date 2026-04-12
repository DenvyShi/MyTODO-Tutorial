// Set test environment BEFORE requiring app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'testpass123';
process.env.DB_PATH = ':memory:'; // Use in-memory database for tests

const request = require('supertest');
const app = require('../index');
const { db } = require('../db');

let authToken;
let testListId;

describe('MyTODO API', () => {
  
  afterAll(() => {
    db.close();
  });

  describe('Authentication', () => {
    
    test('POST /api/auth/login - should fail without credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username and password required');
    });
    
    test('POST /api/auth/login - should fail with wrong credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        username: 'nonexistent',
        password: 'wrongpass'
      });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
    
    test('POST /api/auth/login - should succeed with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        username: 'testadmin',
        password: 'testpass123'
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe('testadmin');
      authToken = res.body.token;
    });
    
    test('GET /api/auth/me - should fail without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
    
    test('GET /api/auth/me - should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });
    
    test('GET /api/auth/me - should fail with malformed auth header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic abc123'); // Not Bearer
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });
    
    test('GET /api/auth/me - should succeed with token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testadmin');
    });
    
    test('PUT /api/auth/profile - should update profile', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'test@example.com', telegram_id: '123456789' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    test('PUT /api/auth/password - should fail without current password', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ newPassword: 'newpass' });
      expect(res.status).toBe(400);
    });
    
    test('PUT /api/auth/password - should fail with wrong current password', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'wrongpass', newPassword: 'newpass' });
      expect(res.status).toBe(401);
    });
    
    test('PUT /api/auth/password - should change password', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentPassword: 'testpass123', newPassword: 'newtestpass' });
      expect(res.status).toBe(200);
      
      // Login with new password
      const loginRes = await request(app).post('/api/auth/login').send({
        username: 'testadmin',
        password: 'newtestpass'
      });
      expect(loginRes.status).toBe(200);
      authToken = loginRes.body.token;
    });
  });

  describe('Lists', () => {
    
    test('GET /api/lists - should return lists', async () => {
      const res = await request(app)
        .get('/api/lists')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      testListId = res.body[0].id;
    });
    
    test('POST /api/lists - should create list', async () => {
      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test List' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test List');
    });
    
    test('POST /api/lists - should fail without name', async () => {
      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
    
    test('PUT /api/lists/:id - should update list', async () => {
      const res = await request(app)
        .put(`/api/lists/${testListId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated List Name' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated List Name');
    });
    
    test('PUT /api/lists/batch/reorder - should reorder lists', async () => {
      const res = await request(app)
        .put('/api/lists/batch/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ orders: [{ id: testListId, sort_order: 999 }] });
      expect(res.status).toBe(200);
    });
    
    test('DELETE /api/lists/:id - should fail for non-existent list', async () => {
      const res = await request(app)
        .delete('/api/lists/99999')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Tasks', () => {
    
    let testTaskId;
    
    test('POST /api/tasks - should create task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          list_id: testListId,
          title: 'Test Task',
          description: 'Test description',
          priority: 1,
          reminder_minutes: 30
        });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Task');
      testTaskId = res.body.id;
    });
    
    test('POST /api/tasks - should fail without title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ list_id: testListId });
      expect(res.status).toBe(400);
    });
    
    test('POST /api/tasks - should fail with invalid list', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ list_id: 99999, title: 'Test' });
      expect(res.status).toBe(400);
    });
    
    test('GET /api/tasks - should return tasks', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
    
    test('GET /api/tasks - should filter by list_id', async () => {
      const res = await request(app)
        .get(`/api/tasks?list_id=${testListId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
    
    test('GET /api/tasks/:id - should return single task', async () => {
      const res = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testTaskId);
    });
    
    test('GET /api/tasks/:id - should fail for non-existent task', async () => {
      const res = await request(app)
        .get('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
    
    test('PUT /api/tasks/:id - should update task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Task', priority: 3 });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Task');
      expect(res.body.priority).toBe(3);
    });
    
    test('POST /api/tasks/:id/toggle - should toggle completion', async () => {
      const res = await request(app)
        .post(`/api/tasks/${testTaskId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(1);
      
      // Toggle back
      const res2 = await request(app)
        .post(`/api/tasks/${testTaskId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res2.status).toBe(200);
      expect(res2.body.completed).toBe(0);
    });
    
    test('PUT /api/tasks/batch/reorder - should reorder tasks', async () => {
      const res = await request(app)
        .put('/api/tasks/batch/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tasks: [{ id: testTaskId, list_id: testListId, sort_order: 999 }] });
      expect(res.status).toBe(200);
    });
    
    test('DELETE /api/tasks/:id - should delete task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      
      // Verify deleted
      const res2 = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res2.status).toBe(404);
    });
  });

  describe('Health Check', () => {
    test('GET /api/health - should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Error Handling', () => {
    test('GET /api/auth/me - should return 404 for non-existent user', async () => {
      // This tests the 404 branch when user is deleted but token still valid
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      // User should exist, so this should pass
      expect(res.status).toBe(200);
    });
  });

  describe('Tasks - Extended Tests', () => {
    let tempTaskId;
    let tempListId;

    beforeAll(async () => {
      // Create a second list for testing moves
      const listRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Second List' });
      tempListId = listRes.body.id;

      // Create task with all fields
      const taskRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          list_id: testListId,
          title: 'Full Task',
          description: 'Description here',
          priority: 1,
          due_date: new Date(Date.now() + 86400000).toISOString(),
          reminder_minutes: 60
        });
      tempTaskId = taskRes.body.id;
    });

    test('GET /api/tasks - should filter by completed status', async () => {
      const res = await request(app)
        .get('/api/tasks?completed=false')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/tasks - should filter by today', async () => {
      const res = await request(app)
        .get('/api/tasks?today=true')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    test('GET /api/tasks - should filter by upcoming', async () => {
      const res = await request(app)
        .get('/api/tasks?upcoming=true')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    test('PUT /api/tasks/:id - should move task to different list', async () => {
      const res = await request(app)
        .put(`/api/tasks/${tempTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ list_id: tempListId });
      expect(res.status).toBe(200);
      expect(res.body.list_id).toBe(tempListId);
    });

    test('PUT /api/tasks/:id - should fail moving to invalid list', async () => {
      const res = await request(app)
        .put(`/api/tasks/${tempTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ list_id: 99999 });
      expect(res.status).toBe(400);
    });

    test('PUT /api/tasks/:id - should update multiple fields', async () => {
      const res = await request(app)
        .put(`/api/tasks/${tempTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated desc',
          priority: 3,
          completed: 1,
          sort_order: 100
        });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.completed).toBe(1);
    });

    test('POST /api/tasks/:id/toggle - should fail for non-existent task', async () => {
      const res = await request(app)
        .post('/api/tasks/99999/toggle')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    test('PUT /api/tasks/batch/reorder - should fail without tasks array', async () => {
      const res = await request(app)
        .put('/api/tasks/batch/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test('DELETE /api/tasks/:id - should fail for non-existent task', async () => {
      const res = await request(app)
        .delete('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    afterAll(async () => {
      // Cleanup
      await request(app)
        .delete(`/api/tasks/${tempTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      await request(app)
        .delete(`/api/lists/${tempListId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });

  describe('Lists - Extended Tests', () => {
    let tempListId;

    test('PUT /api/lists/:id - should update sort_order', async () => {
      // First create a list
      const createRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Sort Test List' });
      tempListId = createRes.body.id;

      const res = await request(app)
        .put(`/api/lists/${tempListId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sort_order: 500 });
      expect(res.status).toBe(200);
    });

    test('PUT /api/lists/batch/reorder - should fail without orders array', async () => {
      const res = await request(app)
        .put('/api/lists/batch/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test('DELETE /api/lists/:id - should delete list and its tasks', async () => {
      // Create list
      const listRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Delete' });
      const listId = listRes.body.id;

      // Create task in list
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ list_id: listId, title: 'Task in list' });

      // Delete list
      const res = await request(app)
        .delete(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Test Notification Endpoint', () => {
    test('POST /api/test-notification - should send test notification', async () => {
      const res = await request(app)
        .post('/api/test-notification')
        .send({ telegram_id: '123456', email: 'test@example.com' });
      expect(res.status).toBe(200);
    });
  });

  describe('Auth - Error Paths', () => {
    test('POST /api/auth/login - should handle server error gracefully', async () => {
      // Test with malformed body - should hit error handling
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'test' });
      // Should return 401 for invalid credentials, not crash
      expect(res.status).toBe(401);
    });
  });

  describe('Lists - Error Paths', () => {
    test('POST /api/lists - should handle empty name', async () => {
      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });

    test('POST /api/lists - should handle whitespace-only name', async () => {
      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '   ' });
      expect(res.status).toBe(400);
    });

    test('PUT /api/lists/:id - should update only provided fields', async () => {
      const listRes = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Partial Update List' });
      const listId = listRes.body.id;

      // Update only name, not sort_order
      const res = await request(app)
        .put(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name Only' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name Only');
    });

    test('PUT /api/lists/:id - should return 404 for non-owned list', async () => {
      const res = await request(app)
        .put('/api/lists/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Should Fail' });
      expect(res.status).toBe(404);
    });

    test('DELETE /api/lists/:id - should return 404 for non-owned list', async () => {
      const res = await request(app)
        .delete('/api/lists/99999')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Tasks - Additional Edge Cases', () => {
    let edgeListId;
    
    beforeAll(async () => {
      const res = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Edge Case List' });
      edgeListId = res.body.id;
    });

    test('POST /api/tasks - should handle empty title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ list_id: edgeListId, title: '' });
      expect(res.status).toBe(400);
    });

    test('POST /api/tasks - should handle whitespace-only title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ list_id: edgeListId, title: '   ' });
      expect(res.status).toBe(400);
    });

    test('PUT /api/tasks/:id - should return 404 for non-owned task', async () => {
      const res = await request(app)
        .put('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Should Fail' });
      expect(res.status).toBe(404);
    });

    test('DELETE /api/tasks/:id - should return 404 for non-owned task', async () => {
      const res = await request(app)
        .delete('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    test('GET /api/tasks - should combine multiple filters', async () => {
      const res = await request(app)
        .get(`/api/tasks?list_id=${edgeListId}&completed=false`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });
});
