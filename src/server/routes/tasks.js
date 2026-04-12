const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all tasks (optionally filtered by list_id)
router.get('/', authMiddleware, (req, res) => {
  try {
    const { list_id, completed, today, upcoming } = req.query;
    
    let query = `
      SELECT t.*, l.name as list_name 
      FROM tasks t
      JOIN lists l ON t.list_id = l.id
      WHERE l.user_id = ?
    `;
    const params = [req.user.id];
    
    if (list_id) {
      query += ' AND t.list_id = ?';
      params.push(list_id);
    }
    
    if (completed !== undefined) {
      query += ' AND t.completed = ?';
      params.push(completed === 'true' ? 1 : 0);
    }
    
    if (today === 'true') {
      query += " AND date(t.due_date) = date('now')";
    }
    
    if (upcoming === 'true') {
      query += " AND t.due_date IS NOT NULL AND date(t.due_date) >= date('now') AND t.completed = 0";
    }
    
    query += ' ORDER BY t.sort_order ASC, t.due_date ASC';
    
    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single task
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const task = db.prepare(`
      SELECT t.*, l.name as list_name 
      FROM tasks t
      JOIN lists l ON t.list_id = l.id
      WHERE t.id = ? AND l.user_id = ?
    `).get(req.params.id, req.user.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/', authMiddleware, (req, res) => {
  try {
    const { list_id, title, description, due_date, priority, reminder_minutes } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title required' });
    }
    
    // Verify list ownership
    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(list_id, req.user.id);
    if (!list) {
      return res.status(400).json({ error: 'Invalid list' });
    }
    
    // Get max sort_order in this list
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM tasks WHERE list_id = ?').get(list_id);
    const sortOrder = (maxOrder.max || 0) + 1;
    
    const result = db.prepare(`
      INSERT INTO tasks (list_id, title, description, due_date, priority, reminder_minutes, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      list_id,
      title.trim(),
      description || null,
      due_date || null,
      priority || 2,
      reminder_minutes || null,
      sortOrder
    );
    
    const newTask = db.prepare('SELECT t.*, l.name as list_name FROM tasks t JOIN lists l ON t.list_id = l.id WHERE t.id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { list_id, title, description, due_date, priority, completed, reminder_minutes, sort_order } = req.body;
    
    // Verify ownership
    const task = db.prepare(`
      SELECT t.* FROM tasks t
      JOIN lists l ON t.list_id = l.id
      WHERE t.id = ? AND l.user_id = ?
    `).get(id, req.user.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // If moving to different list, verify new list ownership
    if (list_id !== undefined && list_id !== task.list_id) {
      const newList = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(list_id, req.user.id);
      if (!newList) {
        return res.status(400).json({ error: 'Invalid list' });
      }
    }
    
    db.prepare(`
      UPDATE tasks SET
        list_id = COALESCE(?, list_id),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        due_date = COALESCE(?, due_date),
        priority = COALESCE(?, priority),
        completed = COALESCE(?, completed),
        reminder_minutes = COALESCE(?, reminder_minutes),
        sort_order = COALESCE(?, sort_order),
        reminder_sent = CASE WHEN ? = 0 THEN 0 ELSE reminder_sent END
      WHERE id = ?
    `).run(
      list_id,
      title,
      description,
      due_date,
      priority,
      completed,
      reminder_minutes,
      sort_order,
      completed,
      id
    );
    
    const updatedTask = db.prepare('SELECT t.*, l.name as list_name FROM tasks t JOIN lists l ON t.list_id = l.id WHERE t.id = ?').get(id);
    res.json(updatedTask);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch update sort order (for drag & drop within list or across lists)
router.put('/batch/reorder', authMiddleware, (req, res) => {
  try {
    const { tasks } = req.body; // [{ id: 1, list_id: 1, sort_order: 0 }, ...]
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array required' });
    }
    
    const updateStmt = db.prepare(`
      UPDATE tasks SET list_id = ?, sort_order = ?
      WHERE id = ? AND list_id IN (SELECT id FROM lists WHERE user_id = ?)
    `);
    
    for (const task of tasks) {
      updateStmt.run(task.list_id, task.sort_order, task.id, req.user.id);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Reorder tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const task = db.prepare(`
      SELECT t.* FROM tasks t
      JOIN lists l ON t.list_id = l.id
      WHERE t.id = ? AND l.user_id = ?
    `).get(id, req.user.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle task completion
router.post('/:id/toggle', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    const task = db.prepare(`
      SELECT t.* FROM tasks t
      JOIN lists l ON t.list_id = l.id
      WHERE t.id = ? AND l.user_id = ?
    `).get(id, req.user.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const newCompleted = task.completed ? 0 : 1;
    db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(newCompleted, id);
    
    const updatedTask = db.prepare('SELECT t.*, l.name as list_name FROM tasks t JOIN lists l ON t.list_id = l.id WHERE t.id = ?').get(id);
    res.json(updatedTask);
  } catch (err) {
    console.error('Toggle task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
