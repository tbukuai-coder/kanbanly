const express = require('express');
const router = express.Router();
const { getDb, execSelect, execSelectOne, execInsert, execSql } = require('../db/connection');

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { board_id } = req.query;
    if (!board_id) {
      const err = new Error('board_id is required');
      err.type = 'validation';
      throw err;
    }
    const labels = execSelect(db, 'SELECT * FROM labels WHERE board_id = ?', [board_id]);
    res.json(labels);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { board_id, name, color } = req.body;
    if (!board_id || !name) {
      const err = new Error('board_id and name are required');
      err.type = 'validation';
      throw err;
    }
    const id = execInsert(db, 'INSERT INTO labels (board_id, name, color) VALUES (?, ?, ?)',
      [board_id, name, color || '#6B7280']);
    const label = execSelectOne(db, 'SELECT * FROM labels WHERE id = ?', [id]);
    res.status(201).json(label);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const existing = execSelectOne(db, 'SELECT * FROM labels WHERE id = ?', [req.params.id]);
    if (!existing) {
      const err = new Error('Label not found');
      err.type = 'not_found';
      throw err;
    }
    execSql(db, 'DELETE FROM labels WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
