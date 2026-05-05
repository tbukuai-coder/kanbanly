const db = require('./connection');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_id INTEGER NOT NULL,
      board_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assignee TEXT,
      due_date TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6B7280',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS card_labels (
      card_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      PRIMARY KEY (card_id, label_id),
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      card_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      old_value TEXT,
      new_value TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
    CREATE INDEX IF NOT EXISTS idx_cards_column_id ON cards(column_id);
    CREATE INDEX IF NOT EXISTS idx_cards_board_id ON cards(board_id);
    CREATE INDEX IF NOT EXISTS idx_labels_board_id ON labels(board_id);
    CREATE INDEX IF NOT EXISTS idx_card_labels_card_id ON card_labels(card_id);
    CREATE INDEX IF NOT EXISTS idx_card_labels_label_id ON card_labels(label_id);
    CREATE INDEX IF NOT EXISTS idx_activity_board_id ON activity_log(board_id);
    CREATE INDEX IF NOT EXISTS idx_activity_card_id ON activity_log(card_id);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);

    CREATE TRIGGER IF NOT EXISTS boards_updated
    AFTER UPDATE ON boards
    BEGIN
      UPDATE boards SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS cards_updated
    AFTER UPDATE ON cards
    BEGIN
      UPDATE cards SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  console.log('Database initialized successfully.');
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
