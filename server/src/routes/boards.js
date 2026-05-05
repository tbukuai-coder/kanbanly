const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', (req, res, next) => {
  try {
    const boards = db.prepare('SELECT * FROM boards ORDER BY created_at DESC').all();
    res.json(boards);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    if (!board) {
      const err = new Error('Board not found');
      err.type = 'not_found';
      throw err;
    }

    const columns = db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC').all(board.id);
    const cards = db.prepare('SELECT * FROM cards WHERE board_id = ? ORDER BY position ASC').all(board.id);
    const labels = db.prepare('SELECT * FROM labels WHERE board_id = ?').all(board.id);
    const cardLabels = db.prepare(`
      SELECT cl.card_id, cl.label_id
      FROM card_labels cl
      JOIN cards c ON c.id = cl.card_id
      WHERE c.board_id = ?
    `).all(board.id);

    res.json({ ...board, columns, cards, labels, cardLabels });
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      const err = new Error('Board name is required');
      err.type = 'validation';
      throw err;
    }
    const result = db.prepare('INSERT INTO boards (name, description) VALUES (?, ?)').run(name, description || null);
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, description } = req.body;
    const existing = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    if (!existing) {
      const err = new Error('Board not found');
      err.type = 'not_found';
      throw err;
    }
    db.prepare('UPDATE boards SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?')
      .run(name, description, req.params.id);
    const updated = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    if (!existing) {
      const err = new Error('Board not found');
      err.type = 'not_found';
      throw err;
    }
    db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
