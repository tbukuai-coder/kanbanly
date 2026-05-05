import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { CardService } from '../../services/card.service';
import { ColumnService } from '../../services/column.service';
import { BoardDetail } from '../../models/board.model';
import { Card } from '../../models/card.model';
import { ColumnComponent } from '../column/column.component';
import { SearchBarComponent } from '../search/search-bar.component';
import { ActivityFeedComponent } from '../activity/activity-feed.component';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ColumnComponent, SearchBarComponent, ActivityFeedComponent],
  template: `
    <div class="board-detail">
      @if (board(); as b) {
        <div class="board-header">
          <a routerLink="/" class="back-link">&larr; All Boards</a>
          <h2>{{ b.name }}</h2>
          @if (b.description) {
            <p class="board-description">{{ b.description }}</p>
          }
          <app-search-bar (searchChange)="onSearch($event)" />
        </div>

        <div class="kanban-board">
          @for (column of b.columns; track column.id) {
            <app-column
              [column]="column"
              [cards]="getCardsForColumn(column.id)"
              [labels]="b.labels"
              [columnIds]="columnIds()"
              (cardMoved)="onCardMoved($event)"
              (cardUpdated)="onCardUpdated($event)"
              (cardCreated)="onCardCreated()"
            />
          }
          <div class="add-column-container">
            @if (showColumnForm()) {
              <div class="column-form">
                <input
                  type="text"
                  [(ngModel)]="newColumnName"
                  placeholder="Column name"
                  (keyup.enter)="createColumn()"
                  autofocus
                />
                <button class="btn-save" (click)="createColumn()">Add</button>
                <button class="btn-cancel" (click)="toggleColumnForm()">Cancel</button>
              </div>
            } @else {
              <button class="btn-add-column" (click)="toggleColumnForm()">+ Add Column</button>
            }
          </div>
        </div>

        <app-activity-feed [boardId]="b.id" />
      } @else {
        <p class="loading">Loading board...</p>
      }
    </div>
  `,
  styles: [`
    .board-header { margin-bottom: 1.5rem; }
    .back-link { color: #3b82f6; text-decoration: none; font-size: 0.875rem; }
    .board-description { color: #64748b; }
    .kanban-board { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; align-items: flex-start; }
    .loading { text-align: center; padding: 3rem; color: #94a3b8; }
    .add-column-container { min-width: 250px; flex-shrink: 0; }
    .btn-add-column { width: 100%; padding: 0.75rem; background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; color: #64748b; cursor: pointer; font-size: 0.875rem; }
    .btn-add-column:hover { background: #e2e8f0; border-color: #94a3b8; }
    .column-form { background: #fff; border-radius: 8px; padding: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .column-form input { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 0.5rem; box-sizing: border-box; }
    .column-form .btn-save { padding: 0.5rem 1rem; background: #3b82f6; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; }
    .column-form .btn-cancel { padding: 0.5rem 1rem; background: #f1f5f9; border: none; border-radius: 4px; cursor: pointer; }
  `]
})
export class BoardDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private boardService = inject(BoardService);
  private cardService = inject(CardService);
  private columnService = inject(ColumnService);

  board = signal<BoardDetail | null>(null);
  searchQuery = signal('');
  showColumnForm = signal(false);
  newColumnName = '';

  columnIds = computed(() => {
    const b = this.board();
    return b ? b.columns.map(c => 'column-' + c.id) : [];
  });

  filteredCards = computed(() => {
    const b = this.board();
    if (!b) return [];
    const q = this.searchQuery().toLowerCase();
    if (!q) return b.cards;
    return b.cards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.assignee && c.assignee.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    const boardId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadBoard(boardId);
  }

  loadBoard(id: number): void {
    this.boardService.getBoardDetail(id).subscribe(board => this.board.set(board));
  }

  getCardsForColumn(columnId: number): Card[] {
    return this.filteredCards()
      .filter(c => c.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onCardMoved(event: { cardId: number; targetColumnId: number; targetPosition: number }): void {
    this.cardService.moveCard(event.cardId, {
      column_id: event.targetColumnId,
      position: event.targetPosition
    }).subscribe(() => this.reloadBoard());
  }

  onCardUpdated(event: { card: Card; action: 'save' | 'delete' }): void {
    if (event.action === 'delete') {
      this.cardService.deleteCard(event.card.id).subscribe(() => this.reloadBoard());
    } else {
      this.cardService.updateCard(event.card.id, {
        title: event.card.title,
        description: event.card.description,
        assignee: event.card.assignee,
        due_date: event.card.due_date
      }).subscribe(() => this.reloadBoard());
    }
  }

  onCardCreated(): void {
    this.reloadBoard();
  }

  toggleColumnForm(): void {
    this.showColumnForm.update(v => !v);
    if (!this.showColumnForm()) this.newColumnName = '';
  }

  createColumn(): void {
    const name = this.newColumnName.trim();
    if (!name) return;
    const b = this.board();
    if (!b) return;
    const position = b.columns.length;
    this.columnService.createColumn({ board_id: b.id, name, position }).subscribe(() => {
      this.newColumnName = '';
      this.showColumnForm.set(false);
      this.reloadBoard();
    });
  }

  private reloadBoard(): void {
    const boardId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadBoard(boardId);
  }
}
