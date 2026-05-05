# Roadmap — Kanban Board App

## Current State

A working full-stack Kanban board with Angular 17 frontend, Express REST API, and SQLite WAL database. All core features from the initial build are functional: boards, columns, cards with labels/assignees/due dates, drag-and-drop, search, and activity log.

---

## Short-Term (Stability & Polish)

### Testing
- **Unit tests (server)** — Add tests for route handlers and database operations using a test SQLite instance. Cover validation errors, not-found cases, and transaction rollback on failure.
- **Unit tests (client)** — Add component tests with Angular TestBed. Cover signal state changes, event emission, and template rendering for each component.
- **E2E tests** — Add a minimal Cypress or Playwright suite covering the critical path: create board → add cards → drag card between columns → search → delete card.

### Error Handling & Resilience
- **Client-side error toasts** — Surface API errors (network, validation, server) to the user with dismissible toast notifications instead of silent failures.
- **Server request logging** — Add request ID tracking to correlate error logs.
- **Graceful board reloading** — Currently `reloadBoard()` re-fetches the entire board on every mutation. Add optimistic updates for card moves and edits to reduce latency and avoid UI flicker.

### UI Polish
- **Loading skeletons** — Replace text-based "Loading..." placeholders with skeleton placeholders that mimic the shape of the content being loaded.
- **Empty states** — Improve empty column and empty board-list states with illustrative icons and action prompts.
- **Responsive layout** — The current layout uses horizontal scrolling for columns. Add mobile-friendly stacked layout with touch-based drag-and-drop support.
- **Keyboard accessibility** — Ensure all interactive elements are focusable and operable via keyboard. Add keyboard shortcuts for common actions (e.g., `Escape` to close modals, `Enter` to submit forms).

---

## Medium-Term (Feature Completion)

### Column Management
- **Rename columns** — Inline editing of column names via double-click or edit button.
- **Add/delete columns** — UI for creating new columns and deleting existing ones (with confirmation and card reallocation).
- **Column reordering** — Drag-and-drop column reordering (server endpoint `POST /api/columns/reorder` already exists but has no client integration).

### Label Management
- **Label CRUD UI** — Server endpoints for labels exist (GET/POST/DELETE). Add a label management panel to the board detail view: create labels with custom colors, assign/remove labels from cards in the edit modal, delete labels.
- **Label filter** — Toggle filter by label in the board view alongside search.

### Card Enhancements
- **Card detail view** — Expand the edit modal or add a dedicated card detail page with full edit history, comments, and attachment support.
- **Card reordering within column** — Drag-and-drop to reorder cards within the same column (currently only cross-column moves are handled by the `cardMoved` event; same-column reorder needs position-shift logic).
- **Due date warnings** — Highlight cards with overdue or approaching due dates using color indicators.
- **Card templates** — Save and apply card templates for recurring task types.

### Board Management
- **Board settings** — Rename and delete boards from within the board detail view (not just the list view). Add board description editing.
- **Board archiving** — Soft-delete boards by marking them as archived instead of permanently deleting.
- **Multiple board views** — Support switching between column (Kanban) view and list view.

---

## Long-Term (Scale & Advanced Features)

### Real-Time Collaboration
- **WebSocket integration** — Replace the current request-response pattern with WebSocket events for live card updates when multiple users view the same board simultaneously.
- **Presence indicators** — Show which users are currently viewing or editing a board.
- **Conflict resolution** — Handle concurrent edits to the same card with last-write-wins or manual merge.

### Authentication & Multi-User
- **User accounts** — Add a `users` table, registration, and login endpoints using bcrypt + JWT.
- **Board ownership & sharing** — Associate boards with owners. Add a board sharing mechanism with read/write permissions.
- **User mentions** — Allow `@username` mentions in card comments that trigger notifications.

### Attachments & Rich Content
- **File attachments** — Add an `attachments` table and file upload endpoint. Display file links on cards.
- **Card comments** — Add a comments table and API. Thread comments on cards with timestamps and author info.
- **Markdown support** — Render card descriptions as markdown with preview mode.

### Import/Export
- **CSV export** — Export board data (cards, columns, labels) as CSV.
- **JSON export/import** — Full board backup and restore via JSON.
- **Trello import** — Import boards from Trello JSON exports.

### Performance & Deployment
- **Database migrations** — Replace the current init/reset scripts with a proper migration system (e.g., node-db-migrate) for incremental schema changes.
- **Server-side pagination** — Add cursor-based pagination to the activity log and card search endpoints.
- **Caching layer** — Add Redis caching for frequently accessed board detail responses.
- **Docker setup** — Add Dockerfile and docker-compose for one-command local development.
- **CI/CD pipeline** — GitHub Actions workflow for running tests, linting, and building on push.

---

## Technical Debt

| Area | Issue | Priority |
|------|-------|----------|
| Client state | Full board reload on every mutation causes flicker | High |
| Client types | Some model interfaces use `any` implicitly (e.g., `CardMoveRequest`) | Low |
| Server search | Label filter requires a separate query instead of a JOIN | Medium |
| Server auth | No authentication — all boards are public | Medium |
| Database | No migration system — `db:reset` drops all data | Medium |
| Client CSS | Styles are inline in components — consider shared utility classes for repeated patterns | Low |
| Tests | Zero test coverage | High |
