import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BoardService } from '../../services/board.service';
import { Board } from '../../models/board.model';

@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="board-list">
      <div class="board-list-header">
        <h2>Boards</h2>
        <button class="btn-primary" (click)="showForm.set(true)">+ New Board</button>
      </div>

      @if (showForm()) {
        <form class="new-board-form" (ngSubmit)="createBoard()">
          <input
            type="text"
            [(ngModel)]="newBoardName"
            name="name"
            placeholder="Board name"
            required
            autofocus
          />
          <input
            type="text"
            [(ngModel)]="newBoardDesc"
            name="description"
            placeholder="Description (optional)"
          />
          <button type="submit" class="btn-primary">Create</button>
          <button type="button" class="btn-secondary" (click)="showForm.set(false)">Cancel</button>
        </form>
      }

      <div class="boards-grid">
        @for (board of boards(); track board.id) {
          <a [routerLink]="['/boards', board.id]" class="board-card">
            <h3>{{ board.name }}</h3>
            <p>{{ board.description || 'No description' }}</p>
            <span class="board-date">Created: {{ board.created_at | date }}</span>
          </a>
        } @empty {
          <p class="empty-state">No boards yet. Create your first board above.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .board-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .boards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .board-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.2s;
    }
    .board-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .board-card h3 { margin: 0 0 0.5rem; }
    .board-card p { color: #64748b; margin: 0 0 1rem; }
    .board-date { font-size: 0.75rem; color: #94a3b8; }
    .new-board-form { display: flex; gap: 0.5rem; margin: 1rem 0; flex-wrap: wrap; }
    .new-board-form input { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; flex: 1; min-width: 180px; }
    .empty-state { color: #94a3b8; grid-column: 1 / -1; text-align: center; padding: 3rem; }
  `]
})
export class BoardListComponent implements OnInit {
  boards = signal<Board[]>([]);
  showForm = signal(false);
  newBoardName = '';
  newBoardDesc = '';

  constructor(private boardService: BoardService) {}

  ngOnInit(): void {
    this.loadBoards();
  }

  loadBoards(): void {
    this.boardService.getBoards().subscribe(boards => this.boards.set(boards));
  }

  createBoard(): void {
    if (!this.newBoardName.trim()) return;
    this.boardService.createBoard({ name: this.newBoardName, description: this.newBoardDesc || undefined })
      .subscribe(() => {
        this.newBoardName = '';
        this.newBoardDesc = '';
        this.showForm.set(false);
        this.loadBoards();
      });
  }
}
