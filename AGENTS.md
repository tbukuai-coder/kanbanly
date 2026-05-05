# AGENTS.md — Kanban Board App

## Project Overview

Full-stack Kanban board: Angular 17 SPA frontend + Node/Express REST API + SQLite WAL database.

- **Client**: `/client/` — Angular 17, standalone components, signals, CDK drag-drop
- **Server**: `/server/` — Express 5, better-sqlite3 (synchronous), port 3000
- **Database**: SQLite WAL mode, file at `server/data/kanban.db`

## Working on This Project

### Always Start Here
1. Read this file and `README.md` before making changes
2. Check `git status` to understand current state
3. Match existing code patterns exactly

### Server Rules
- Use `better-sqlite3` synchronous API — never wrap in async/promises
- All writes (create/update/move/delete) must use transactions (`db.transaction()`)
- Always log to `activity_log` table on card mutations
- Validate inputs and throw typed errors (`err.type = 'validation'` | `'not_found'`)
- Database connection is a singleton via `require('../db/connection')`

### Client Rules
- Use standalone components only — no NgModules
- Use signals (`signal()`, `computed()`) for local component state
- Use `inject()` for dependency injection in the constructor body
- Match the existing template syntax: `@if`, `@for`, `@empty` control flows
- Keep styles in the component `styles` array — no external SCSS files per component
- Services extend `ApiService` and use `Observable` return types
- Event emitters propagate to parent; parents call services and reload data

### File Naming
- Components: `feature-name.component.ts` (e.g., `column.component.ts`)
- Services: `feature.service.ts` (e.g., `card.service.ts`)
- Models: `feature.model.ts` (e.g., `card.model.ts`)
- Routes: `feature.js` (e.g., `cards.js`)

### Database Schema Changes
- Edit `server/src/db/init.js` for schema changes
- Run `npm run db:reset` followed by `npm run db:seed` to apply
- Never manually edit the `.db` file

### Adding a New API Endpoint
1. Add route handler in `server/src/<routes>/feature.js`
2. Mount in `server/src/index.js` if new router file
3. Add corresponding method in `client/src/app/services/feature.service.ts`
4. Call from the appropriate component

### Adding a New Component
1. Create in `client/src/app/components/<feature>/`
2. Add to parent component's `imports` array
3. Use `@Input()` / `@Output()` for parent-child communication
4. Keep it standalone with required imports listed explicitly

## Common Patterns

### Server: Transaction with activity log
```javascript
const createCard = db.transaction((card) => {
  const result = db.prepare('INSERT INTO cards (...) VALUES (...)').run(...);
  db.prepare('INSERT INTO activity_log (board_id, card_id, action, details) VALUES (?, ?, ?, ?)')
    .run(card.board_id, result.lastInsertRowid, 'card.created', card.title);
  return result;
});
```

### Client: Signal-based component with event emission
```typescript
@Component({ ... })
export class MyComponent {
  @Input({ required: true }) item!: MyType;
  @Output() itemChanged = new EventEmitter<MyType>();
  editing = signal(false);

  save(): void {
    this.itemChanged.emit(this.item);
    this.editing.set(false);
  }
}
```

### Client: Service method
```typescript
updateItem(id: number, updates: Partial<Item>): Observable<Item> {
  return this.api.put<Item>(`/items/${id}`, updates);
}
```

## Gotchas
- CDK version must match Angular major version (both v17 here) — mismatches cause build failures
- `better-sqlite3` is synchronous — do not `await` its calls
- Angular 17 uses `@if`/`@for` block syntax, not `*ngIf`/`*ngFor`
- `computed()` signals return a `ComputedSignal` — call with `()` in templates to unwrap
- `signal()` used in `@Input()` declarations causes type errors — use plain types for inputs
