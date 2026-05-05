const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.post('/', (req, res, next) => {
  try {
    const { board_id, name, position } = req.body;
    if (!board_id || !name) {
      const err = new Error('board_id and name are required');
      err.type = 'validation';
      throw err;
    }

    let pos = position;
    if (pos === undefined) {
      const maxPos = db.prepare('SELECT MAX(position) as max FROM columns WHERE board_id = ?').get(board_id);
      pos = (maxPos.max !== null ? maxPos.max + 1 : 0);
    }

    const result = db.prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)')
      .run(board_id, name, pos);
    const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(column);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, position } = req.body;
    const existing = db.prepare('SELECT * FROM columns WHERE id = ?').get(req.params.id);
    if (!existing) {
      const err = new Error('Column not found');
      err.type = 'not_found';
      throw err;
    }
    db.prepare('UPDATE columns SET name = COALESCE(?, name), position = COALESCE(?, position) WHERE id = ?')
      .run(name, position, req.params.id);
    const updated = db.prepare('SELECT * FROM columns WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM columns WHERE id = ?').get(req.params.id);
    if (!existing) {
      const err = new Error('Column not found');
      err.type = 'not_found';
      throw err;
    }
    db.prepare('DELETE FROM columns WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/reorder', (req, res, next) => {
  try {
    const { columns } = req.body;
    if (!Array.isArray(columns)) {
      const err = new Error('columns array is required');
      err.type = 'validation';
      throw err;
    }
    const update = db.prepare('UPDATE columns SET position = ? WHERE id = ?');
    const transaction = db.transaction((items) => {
      for (const item of items) {
        update.run(item.position, item.id);
      }
    });
    transaction(columns);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
