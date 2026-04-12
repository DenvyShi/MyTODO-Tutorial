const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all lists for current user
router.get('/', authMiddleware, (req, res) => {
  try {
    const lists = db.prepare(`
      SELECT * FROM lists 
      WHERE user_id = ? 
      ORDER BY sort_order ASC
    `).all(req.user.id);
    
    res.json(lists);
  } catch (err) {
    console.error('Get lists error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new list
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'List name required' });
    }
    
    // Available icons for random selection
    const availableIcons = [
      'ListTodo', 'Briefcase', 'User', 'Home', 'ShoppingCart',
      'Heart', 'Star', 'Book', 'Music', 'Camera', 'Film', 'Gamepad2',
      'Plane', 'Car', 'Bike', 'Utensils', 'Coffee', 'Dumbbell',
      'GraduationCap', 'Code', 'Palette', 'Pen', 'Lightbulb', 'Target',
      'Trophy', 'Gift', 'Bell', 'Bookmark', 'Folder', 'FileText'
    ];
    
    // Get existing icons for this user
    const existingLists = db.prepare('SELECT icon FROM lists WHERE user_id = ?').all(req.user.id);
    const usedIcons = existingLists.map(l => l.icon);
    
    // Find unused icons or pick random if all used
    const unusedIcons = availableIcons.filter(icon => !usedIcons.includes(icon));
    const randomIcon = unusedIcons.length > 0 
      ? unusedIcons[Math.floor(Math.random() * unusedIcons.length)]
      : availableIcons[Math.floor(Math.random() * availableIcons.length)];
    
    // Get max sort_order
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM lists WHERE user_id = ?').get(req.user.id);
    const sortOrder = (maxOrder.max || 0) + 1;
    
    const result = db.prepare('INSERT INTO lists (name, icon, user_id, sort_order) VALUES (?, ?, ?, ?)')
      .run(name.trim(), randomIcon, req.user.id, sortOrder);
    
    const newList = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newList);
  } catch (err) {
    console.error('Create list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update list
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;
    
    // Verify ownership
    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    
    if (name !== undefined) {
      db.prepare('UPDATE lists SET name = ? WHERE id = ?').run(name.trim(), id);
    }
    
    if (sort_order !== undefined) {
      db.prepare('UPDATE lists SET sort_order = ? WHERE id = ?').run(sort_order, id);
    }
    
    const updatedList = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
    res.json(updatedList);
  } catch (err) {
    console.error('Update list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch update sort order (for drag & drop)
router.put('/batch/reorder', authMiddleware, (req, res) => {
  try {
    const { orders } = req.body; // [{ id: 1, sort_order: 0 }, ...]
    
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: 'Orders array required' });
    }
    
    const updateStmt = db.prepare('UPDATE lists SET sort_order = ? WHERE id = ? AND user_id = ?');
    
    for (const item of orders) {
      updateStmt.run(item.sort_order, item.id, req.user.id);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Reorder lists error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete list
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const list = db.prepare('SELECT * FROM lists WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    
    db.prepare('DELETE FROM lists WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
