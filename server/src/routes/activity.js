const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', (req, res, next) => {
  try {
    const { board_id, card_id, limit = 50, offset = 0 } = req.query;

    if (!board_id && !card_id) {
      const err = new Error('board_id or card_id is required');
      err.type = 'validation';
      throw err;
    }

    let query = 'SELECT * FROM activity_log WHERE 1=1';
    const params = [];

    if (board_id) {
      query += ' AND board_id = ?';
      params.push(board_id);
    }
    if (card_id) {
      query += ' AND card_id = ?';
      params.push(card_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const activities = db.prepare(query).all(...params);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
