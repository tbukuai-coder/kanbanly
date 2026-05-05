const express = require('express');
const router = express.Router();
const { getDb, execSelect, execSelectOne, execInsert, execSql } = require('../db/connection');

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const boards = execSelect(db, 'SELECT * FROM boards ORDER BY created_at DESC');
    res.json(boards);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const board = execSelectOne(db, 'SELECT * FROM boards WHERE id = ?', [req.params.id]);
    if (!board) {
      const err = new Error('Board not found');
      err.type = 'not_found';
      throw err;
    }

    const columns = execSelect(db, 'SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC', [board.id]);
    const cards = execSelect(db, 'SELECT * FROM cards WHERE board_id = ? ORDER BY position ASC', [board.id]);
    const labels = execSelect(db, 'SELECT * FROM labels WHERE board_id = ?', [board.id]);
    const cardLabels = execSelect(db, `
      SELECT cl.card_id, cl.label_id
      FROM card_labels cl
      JOIN cards c ON c.id = cl.card_id
      WHERE c.board_id = ?
    `, [board.id]);

    res.json({ ...board, columns, cards, labels, cardLabels });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, description } = req.body;
    if (!name) {
      const err = new Error('Board name is required');
      err.type = 'validation';
      throw err;
    }
    const id = execInsert(db, 'INSERT INTO boards (name, description) VALUES (?, ?)', [name, description || null]);
    const defaultColumns = ['To Do', 'In Progress', 'Done'];
    defaultColumns.forEach((colName, i) => {
      execInsert(db, 'INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)', [id, colName, i]);
    });
    const board = execSelectOne(db, 'SELECT * FROM boards WHERE id = ?', [id]);
    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, description } = req.body;
    const existing = execSelectOne(db, 'SELECT * FROM boards WHERE id = ?', [req.params.id]);
    if (!existing) {
      const err = new Error('Board not found');
      err.type = 'not_found';
      throw err;
    }
    execSql(db, 'UPDATE boards SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
      [name, description, req.params.id]);
    const updated = execSelectOne(db, 'SELECT * FROM boards WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const existing = execSelectOne(db, 'SELECT * FROM boards WHERE id = ?', [req.params.id]);
    if (!existing) {
      const err = new Error('Board not found');
      err.type = 'not_found';
      throw err;
    }
    execSql(db, 'DELETE FROM boards WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
