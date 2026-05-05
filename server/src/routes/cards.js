const express = require('express');
const router = express.Router();
const { getDb, execSelect, execSelectOne, execInsert, execSql } = require('../db/connection');

router.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { board_id, q, label_id, assignee, column_id } = req.query;

    let query = 'SELECT * FROM cards WHERE 1=1';
    const params = [];

    if (board_id) {
      query += ' AND board_id = ?';
      params.push(board_id);
    }
    if (q) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (assignee) {
      query += ' AND assignee = ?';
      params.push(assignee);
    }
    if (column_id) {
      query += ' AND column_id = ?';
      params.push(column_id);
    }
    query += ' ORDER BY position';

    let cards = execSelect(db, query, params);

    if (label_id) {
      const labelCards = execSelect(db, 'SELECT card_id FROM card_labels WHERE label_id = ?', [label_id]);
      const cardIds = new Set(labelCards.map(r => r.card_id));
      cards = cards.filter(c => cardIds.has(c.id));
    }

    if (board_id) {
      const cardLabels = execSelect(db, `
        SELECT cl.card_id, l.id as label_id, l.name, l.color
        FROM card_labels cl
        JOIN labels l ON l.id = cl.label_id
        WHERE l.board_id = ?
      `, [board_id]);

      const labelMap = {};
      cardLabels.forEach(cl => {
        if (!labelMap[cl.card_id]) labelMap[cl.card_id] = [];
        labelMap[cl.card_id].push({ id: cl.label_id, name: cl.name, color: cl.color });
      });

      cards = cards.map(card => ({
        ...card,
        labels: labelMap[card.id] || []
      }));
    }

    res.json(cards);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const db = await getDb();
    const { board_id, column_id, title, description, assignee, due_date, label_ids } = req.body;
    if (!board_id || !column_id || !title) {
      const err = new Error('board_id, column_id, and title are required');
      err.type = 'validation';
      throw err;
    }

    const maxPos = execSelectOne(db, 'SELECT MAX(position) as max FROM cards WHERE column_id = ?', [column_id]);
    const position = maxPos && maxPos.max !== null ? maxPos.max + 1 : 0;

    const id = execInsert(db,
      'INSERT INTO cards (board_id, column_id, title, description, assignee, due_date, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [board_id, column_id, title, description || null, assignee || null, due_date || null, position]
    );

    const card = execSelectOne(db, 'SELECT * FROM cards WHERE id = ?', [id]);

    if (Array.isArray(label_ids) && label_ids.length > 0) {
      for (const labelId of label_ids) {
        execSql(db, 'INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [card.id, labelId]);
      }
    }

    execSql(db, 'INSERT INTO activity_log (board_id, card_id, action, details) VALUES (?, ?, ?, ?)',
      [board_id, card.id, 'card.created', JSON.stringify({ title, column_id })]);

    const cardLabels = execSelect(db, `
      SELECT l.id, l.name, l.color
      FROM card_labels cl
      JOIN labels l ON l.id = cl.label_id
      WHERE cl.card_id = ?
    `, [card.id]);

    res.status(201).json({ ...card, labels: cardLabels });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const existing = execSelectOne(db, 'SELECT * FROM cards WHERE id = ?', [req.params.id]);
    if (!existing) {
      const err = new Error('Card not found');
      err.type = 'not_found';
      throw err;
    }

    const { title, description, assignee, due_date, label_ids } = req.body;

    const changes = {};
    if (title !== undefined && title !== existing.title) changes.title = { old: existing.title, new: title };
    if (description !== undefined && description !== existing.description) changes.description = { old: existing.description, new: description };
    if (assignee !== undefined && assignee !== existing.assignee) changes.assignee = { old: existing.assignee, new: assignee };
    if (due_date !== undefined && due_date !== existing.due_date) changes.due_date = { old: existing.due_date, new: due_date };

    execSql(db, `UPDATE cards SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      assignee = COALESCE(?, assignee),
      due_date = COALESCE(?, due_date)
      WHERE id = ?`,
      [title, description, assignee, due_date, req.params.id]
    );

    if (Array.isArray(label_ids)) {
      execSql(db, 'DELETE FROM card_labels WHERE card_id = ?', [req.params.id]);
      if (label_ids.length > 0) {
        for (const labelId of label_ids) {
          execSql(db, 'INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)', [req.params.id, labelId]);
        }
        changes.labels = true;
      }
    }

    if (Object.keys(changes).length > 0) {
      execSql(db, 'INSERT INTO activity_log (board_id, card_id, action, details) VALUES (?, ?, ?, ?)',
        [existing.board_id, existing.id, 'card.updated', JSON.stringify(Object.keys(changes))]
      );
    }

    const updated = execSelectOne(db, 'SELECT * FROM cards WHERE id = ?', [req.params.id]);
    const cardLabels = execSelect(db, `
      SELECT l.id, l.name, l.color
      FROM card_labels cl
      JOIN labels l ON l.id = cl.label_id
      WHERE cl.card_id = ?
    `, [updated.id]);

    res.json({ ...updated, labels: cardLabels });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/move', async (req, res, next) => {
  try {
    const db = await getDb();
    const { column_id, position } = req.body;
    const card = execSelectOne(db, 'SELECT * FROM cards WHERE id = ?', [req.params.id]);
    if (!card) {
      const err = new Error('Card not found');
      err.type = 'not_found';
      throw err;
    }

    const oldColumnId = card.column_id;
    const oldPosition = card.position;

    execSql(db, 'UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?',
      [oldColumnId, oldPosition]);
    execSql(db, 'UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ?',
      [column_id, position]);
    execSql(db, 'UPDATE cards SET column_id = ?, position = ? WHERE id = ?',
      [column_id, position, req.params.id]);

    const oldCol = execSelectOne(db, 'SELECT name FROM columns WHERE id = ?', [oldColumnId]);
    const newCol = execSelectOne(db, 'SELECT name FROM columns WHERE id = ?', [column_id]);
    execSql(db, 'INSERT INTO activity_log (board_id, card_id, action, details) VALUES (?, ?, ?, ?)',
      [card.board_id, card.id, 'card.moved', JSON.stringify({
        from: oldCol?.name,
        to: newCol?.name
      })]
    );

    const updated = execSelectOne(db, 'SELECT * FROM cards WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const card = execSelectOne(db, 'SELECT * FROM cards WHERE id = ?', [req.params.id]);
    if (!card) {
      const err = new Error('Card not found');
      err.type = 'not_found';
      throw err;
    }

    execSql(db, 'DELETE FROM cards WHERE id = ?', [req.params.id]);
    execSql(db, 'UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?',
      [card.column_id, card.position]);
    execSql(db, 'INSERT INTO activity_log (board_id, card_id, action, details) VALUES (?, ?, ?, ?)',
      [card.board_id, null, 'card.deleted', JSON.stringify({ title: card.title })]
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
