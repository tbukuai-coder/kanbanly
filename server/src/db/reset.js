const db = require('./connection');
const { initializeDatabase } = require('./init');

function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS activity_log;
    DROP TABLE IF EXISTS card_labels;
    DROP TABLE IF EXISTS labels;
    DROP TABLE IF EXISTS cards;
    DROP TABLE IF EXISTS columns;
    DROP TABLE IF EXISTS boards;
  `);
  console.log('All tables dropped.');
  initializeDatabase();
  console.log('Database reset complete.');
}

if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };
