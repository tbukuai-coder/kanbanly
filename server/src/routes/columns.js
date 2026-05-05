const express = require('express');
const router = express.Router();
const { getDb, execSelectOne, execInsert, execSql } = require('../db/connection');

router.post('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { board_id, name, position } = req.body;
    if (!board_id || !name) {
      const err = new Error('board_id and name are required');
      err.type = 'validation';
      throw err;
    }

    let pos = position;
    if (pos === undefined) {
      const maxPos = execSelectOne(db, 'SELECT MAX(position) as max FROM columns WHERE board_id = ?', [board_id]);
      pos = (maxPos && maxPos.max !== null ? maxPos.max + 1 : 0);
    }

    const id = execInsert(db, 'INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)',
      [board_id, name, pos]);
    const column = execSelectOne(db, 'SELECT * FROM columns WHERE id = ?', [id]);
    res.status(201).json(column);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const { name, position } = req.body;
    const existing = execSelectOne(db, 'SELECT * FROM columns WHERE id = ?', [req.params.id]);
    if (!existing) {
      const err = new Error('Column not found');
      err.type = 'not_found';
      throw err;
    }
    execSql(db, 'UPDATE columns SET name = COALESCE(?, name), position = COALESCE(?, position) WHERE id = ?',
      [name, position, req.params.id]);
    const updated = execSelectOne(db, 'SELECT * FROM columns WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const existing = execSelectOne(db, 'SELECT * FROM columns WHERE id = ?', [req.params.id]);
    if (!existing) {
      const err = new Error('Column not found');
      err.type = 'not_found';
      throw err;
    }
    execSql(db, 'DELETE FROM columns WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/reorder', async (req, res, next) => {
  try {
    const db = await getDb();
    const { columns } = req.body;
    if (!Array.isArray(columns)) {
      const err = new Error('columns array is required');
      err.type = 'validation';
      throw err;
    }
    for (const item of columns) {
      execSql(db, 'UPDATE columns SET position = ? WHERE id = ?', [item.position, item.id]);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
