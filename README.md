# Kanban Board App

A full-featured Kanban board application with an Angular 17 frontend and a Node.js/Express REST API backend using SQLite WAL as the database.

## Features

- **Boards** — Create, rename, and delete boards
- **Columns** — Default "To Do", "In Progress", "Done" columns per board; reorder support
- **Cards** — Title, description, assignee, due date, and color-coded labels
- **Drag & Drop** — Move cards between columns with Angular CDK DragDrop
- **Search** — Real-time debounced search across card titles, descriptions, and assignees
- **Labels** — Color-coded labels (Bug, Feature, Urgent, etc.) attached to cards
- **Activity Log** — Append-only feed tracking card creates, moves, updates, and deletes

## Architecture

```
kanban-app/
├── client/          # Angular 17 SPA (standalone components, signals)
│   └── src/app/
│       ├── components/
│       │   ├── activity/    # ActivityFeedComponent
│       │   ├── board/       # BoardListComponent, BoardDetailComponent
│       │   ├── card/        # CardComponent (view + edit modal)
│       │   ├── column/      # ColumnComponent (CDK drag-drop)
│       │   └── search/      # SearchBarComponent (debounced)
│       ├── models/          # TypeScript interfaces
│       └── services/        # HTTP services per domain
├── server/          # Node.js + Express REST API
│   └── src/
│       ├── db/       # SQLite connection, schema, seed
│       ├── routes/   # boards, columns, cards, labels, activity
│       └── middleware/  # error handler
└── data/            # SQLite database file (created on first run)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, Angular CDK, TypeScript, SCSS |
| Backend | Node.js, Express 5, better-sqlite3 |
| Database | SQLite with WAL mode |

## Prerequisites

- Node.js 18+
- npm 9+

## Quick Start

### 1. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install --legacy-peer-deps
```

### 2. Initialize the database

```bash
cd server
npm run db:init    # Create tables and schema
npm run db:seed    # Insert demo data (optional)
```

### 3. Start the server

```bash
cd server
npm run dev        # nodemon, port 3000
```

### 4. Start the client

```bash
cd client
ng serve           # port 4200
```

### 5. Open in browser

Navigate to [http://localhost:4200](http://localhost:4200)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/boards` | List all boards |
| GET | `/api/boards/:id` | Board detail with columns, cards, labels |
| POST | `/api/boards` | Create a board |
| PUT | `/api/boards/:id` | Update a board |
| DELETE | `/api/boards/:id` | Delete a board |
| POST | `/api/columns` | Create a column |
| PUT | `/api/columns/:id` | Update a column |
| DELETE | `/api/columns/:id` | Delete a column |
| POST | `/api/columns/reorder` | Bulk reorder columns |
| GET | `/api/cards` | Search/filter cards (q, label_id, assignee, column_id) |
| POST | `/api/cards` | Create a card |
| PUT | `/api/cards/:id` | Update a card |
| POST | `/api/cards/:id/move` | Move card to column/position |
| DELETE | `/api/cards/:id` | Delete a card |
| GET | `/api/labels` | List labels (filter by board_id) |
| POST | `/api/labels` | Create a label |
| DELETE | `/api/labels/:id` | Delete a label |
| GET | `/api/activity` | Activity log (filter by board_id, limit, offset) |

## Database

SQLite runs in **WAL (Write-Ahead Logging)** mode, which allows concurrent reads during writes — ideal for the Kanban board's read-heavy pattern.

The database file is created at `server/data/kanban.db` on first run.

### Key design decisions

- **Position-based ordering** — Integer `position` columns enable drag-and-drop reordering via simple integer shifts
- **Denormalized `board_id` on cards** — Avoids JOIN through columns for board-scoped card search
- **Transaction-based writes** — Card create/update/move/delete operations use transactions for consistency
- **Activity log** — Append-only table recording all board/card mutations

## Scripts

### Server

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start production server |
| `npm run db:init` | Initialize database schema |
| `npm run db:reset` | Drop all tables and re-init |
| `npm run db:seed` | Insert demo data |

### Client

| Command | Description |
|---------|-------------|
| `ng serve` | Start dev server (port 4200) |
| `ng build` | Production build |
| `ng build --watch` | Watch mode |
