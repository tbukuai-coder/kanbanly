const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', (req, res, next) => {
  try {
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

    let cards = db.prepare(query).all(...params);

    if (label_id) {
      const cardIds = new Set(
        db.prepare('SELECT card_id FROM card_labels WHERE label_id = ?').all(label_id).map(r => r.card_id)
      );
      cards = cards.filter(c => cardIds.has(c.id));
    }

    if (board_id) {
      const cardLabels = db.prepare(`
        SELECT cl.card_id, l.id as label_id, l.name, l.color
        FROM card_labels cl
        JOIN labels l ON l.id = cl.label_id
        WHERE l.board_id = ?
      `).all(board_id);

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

router.post('/', (req, res, next) => {
  const transaction = db.transaction(() => {
    try {
      const { board_id, column_id, title, description, assignee, due_date, label_ids } = req.body;
      if (!board_id || !column_id || !title) {
        const err = new Error('board_id, column_id, and title are required');
        err.type = 'validation';
        throw err;
      }

      const maxPos = db.prepare('SELECT MAX(position) as max FROM cards WHERE column_id = ?').get(column_id);
      const position = maxPos.max !== null ? maxPos.max + 1 : 0;

      const result = db.prepare(
        'INSERT INTO cards (board_id, column_id, title, description, assignee, due_date, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(board_id, column_id, title, description || null, assignee || null, due_date || null, position);

      const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);

      if (Array.isArray(label_ids) && label_ids.length > 0) {
        const insertCL = db.prepare('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)');
        for (const labelId of label_ids) {
          insertCL.run(card.id, labelId);
        }
      }

      db.prepare('INSERT INTO activity_log (board_id, card_id, action, details) VALUES (?, ?, ?, ?)')
        .run(board_id, card.id, 'card.created', JSON.stringify({ title, column_id }));

      const cardLabels = db.prepare(`
        SELECT l.id, l.name, l.color
        FROM card_labels cl
        JOIN labels l ON l.id = cl.label_id
        WHERE cl.card_id = ?
      `).all(card.id);

      res.status(201).json({ ...card, labels: cardLabels });
    } catch (err) {
      next(err);
    }
  });
  transaction();
});

router.put('/:id', (req, res, next) => {
  const transaction = db.transaction(() => {
    try {
      const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
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

      db.prepare(`UPDATE cards SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        assignee = COALESCE(?, assignee),
        due_date = COALESCE(?, due_date)
        WHERE id = ?`
      ).run(title, description, assignee, due_date, req.params.id);

      if (Array.isArray(label_ids)) {
        db.prepare('DELETE FROM card_labels WHERE card_id = ?').run(req.params.id);
        if (label_ids.length > 0) {
          const insertCL = db.prepare('INSERT INTO card_labels (card_id, label_id) VALUES (?, ?)');
          for (const labelId of label_ids) {
            insertCL.run(req.params.id, labelId);
          }
          changes.labels = true;
        }
      }

      if (Object.keys(changes).length > 0) {
        db.prepare('INSERT INTO activity_log (board_id, card_id, action, details) VALUES (?, ?, ?, ?)')
          .run(existing.board_id, existing.id, 'card.updated', JSON.stringify(Object.keys(changes)));
      }

      const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
      const cardLabels = db.prepare(`
        SELECT l.id, l.name, l.color
        FROM card_labels cl
        JOIN labels l ON l.id = cl.label_id
        WHERE cl.card_id = ?
      `).all(updated.id);

      res.json({ ...updated, labels: cardLabels });
    } catch (err) {
      next(err);
    }
  });
  transaction();
});

router.post('/:id/move', (req, res, next) => {
  const transaction = db.transaction(() => {
    try {
      const { column_id, position } = req.body;
      const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
      if (!card) {
        const err = new Error('Card not found');
        err.type = 'not_found';
        throw err;
      }

      const oldColumnId = card.column_id;
      const oldPosition = card.position;

      db.prepare('UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?')
        .run(oldColumnId, oldPosition);
      db.prepare('UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ?')
        .run(column_id, position);
      db.prepare('UPDATE cards SET column_id = ?, position = ? WHERE id = ?')
        .run(column_id, position, req.params.id);

      const oldCol = db.prepare('SELECT name FROM columns WHERE id = ?').get(oldColumnId);
      const newCol = db.prepare('SELECT name FROM columns WHERE id = ?').get(column_id);
      db.prepare('INSERT INTO activity_log (board_id, card_id, action, details) VALUES (?, ?, ?, ?)')
        .run(card.board_id, card.id, 'card.moved', JSON.stringify({
          from: oldCol?.name,
          to: newCol?.name
        }));

      const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });
  transaction();
});

router.delete('/:id', (req, res, next) => {
  const transaction = db.transaction(() => {
    try {
      const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
      if (!card) {
        const err = new Error('Card not found');
        err.type = 'not_found';
        throw err;
      }

      db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
      db.prepare('UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?')
        .run(card.column_id, card.position);
      db.prepare('INSERT INTO activity_log (board_id, card_id, action, details) VALUES (?, ?, ?, ?)')
        .run(card.board_id, null, 'card.deleted', JSON.stringify({ title: card.title }));

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });
  transaction();
});

module.exports = router;
