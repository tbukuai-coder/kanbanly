const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', (req, res, next) => {
  try {
    const { board_id } = req.query;
    if (!board_id) {
      const err = new Error('board_id is required');
      err.type = 'validation';
      throw err;
    }
    const labels = db.prepare('SELECT * FROM labels WHERE board_id = ?').all(board_id);
    res.json(labels);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const { board_id, name, color } = req.body;
    if (!board_id || !name) {
      const err = new Error('board_id and name are required');
      err.type = 'validation';
      throw err;
    }
    const result = db.prepare('INSERT INTO labels (board_id, name, color) VALUES (?, ?, ?)')
      .run(board_id, name, color || '#6B7280');
    const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(label);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM labels WHERE id = ?').get(req.params.id);
    if (!existing) {
      const err = new Error('Label not found');
      err.type = 'not_found';
      throw err;
    }
    db.prepare('DELETE FROM labels WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
