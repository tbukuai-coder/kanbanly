const db = require('./connection');

function seed() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM boards').get();
  if (count.cnt > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  const result = db.prepare('INSERT INTO boards (name, description) VALUES (?, ?)')
    .run('Project Alpha', 'Main project board');
  const boardId = result.lastInsertRowid;

  const insertCol = db.prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)');
  const colTodo = insertCol.run(boardId, 'To Do', 0);
  const colProg = insertCol.run(boardId, 'In Progress', 1);
  const colDone = insertCol.run(boardId, 'Done', 2);

  const insertLabel = db.prepare('INSERT INTO labels (board_id, name, color) VALUES (?, ?, ?)');
  insertLabel.run(boardId, 'Bug', '#EF4444');
  insertLabel.run(boardId, 'Feature', '#3B82F6');
  insertLabel.run(boardId, 'Urgent', '#F59E0B');

  const insertCard = db.prepare(
    'INSERT INTO cards (column_id, board_id, title, description, assignee, due_date, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insertCard.run(colTodo.lastInsertRowid, boardId, 'Set up CI/CD pipeline', 'Configure GitHub Actions', 'Alice', '2026-05-15', 0);
  insertCard.run(colTodo.lastInsertRowid, boardId, 'Design database schema', 'ERD for Kanban', 'Bob', '2026-05-10', 1);
  insertCard.run(colProg.lastInsertRowid, boardId, 'Implement drag-and-drop', 'Use Angular CDK', 'Charlie', '2026-05-12', 0);
  insertCard.run(colDone.lastInsertRowid, boardId, 'Project kickoff', 'Initial planning complete', null, null, 0);

  console.log('Seed data inserted. Board ID:', boardId);
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
