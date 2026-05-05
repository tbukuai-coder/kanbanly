import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { CardService } from '../../services/card.service';
import { BoardDetail } from '../../models/board.model';
import { Card } from '../../models/card.model';
import { ColumnComponent } from '../column/column.component';
import { SearchBarComponent } from '../search/search-bar.component';
import { ActivityFeedComponent } from '../activity/activity-feed.component';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ColumnComponent, SearchBarComponent, ActivityFeedComponent],
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
  `]
})
export class BoardDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private boardService = inject(BoardService);
  private cardService = inject(CardService);

  board = signal<BoardDetail | null>(null);
  searchQuery = signal('');

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

  private reloadBoard(): void {
    const boardId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadBoard(boardId);
  }
}
