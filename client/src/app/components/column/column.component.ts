import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CardComponent } from '../card/card.component';
import { Card } from '../../models/card.model';
import { BoardColumn } from '../../models/column.model';
import { Label } from '../../models/label.model';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, CardComponent],
  template: `
    <div class="column">
      <h3 class="column-header">
        {{ column.name }}
        <span class="card-count">{{ cards.length }}</span>
      </h3>

      <div
        cdkDropList
        [id]="'column-' + column.id"
        [cdkDropListData]="cards"
        [cdkDropListConnectedTo]="columnIds"
        (cdkDropListDropped)="onDrop($event)"
        class="column-cards"
      >
        @for (card of cards; track card.id) {
          <div cdkDrag class="card-wrapper" [cdkDragData]="card">
            <app-card
              [card]="card"
              [labels]="labels"
              (updated)="onCardUpdated($event)"
            />
          </div>
        } @empty {
          <p class="empty-column">No cards</p>
        }
      </div>

      @if (!showAddForm()) {
        <button class="add-card-btn" (click)="showAddForm.set(true)">+ Add Card</button>
      }

      @if (showAddForm()) {
        <form class="add-card-form" (ngSubmit)="addCard()">
          <input
            type="text"
            [(ngModel)]="newCardTitle"
            name="title"
            placeholder="Card title"
            required
            autofocus
          />
          <textarea
            [(ngModel)]="newCardDesc"
            name="description"
            placeholder="Description (optional)"
            rows="2"
          ></textarea>
          <input
            type="text"
            [(ngModel)]="newCardAssignee"
            name="assignee"
            placeholder="Assignee (optional)"
          />
          <div class="form-actions">
            <button type="submit" class="btn-primary">Add</button>
            <button type="button" class="btn-secondary" (click)="showAddForm.set(false)">Cancel</button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .column {
      background: #f1f5f9;
      border-radius: 10px;
      min-width: 300px;
      max-width: 320px;
      flex: 0 0 300px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      max-height: 75vh;
    }
    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .card-count {
      background: #cbd5e1;
      border-radius: 12px;
      padding: 0.1rem 0.5rem;
      font-size: 0.75rem;
    }
    .column-cards {
      flex: 1;
      overflow-y: auto;
      min-height: 60px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.25rem;
    }
    .card-wrapper { cursor: grab; }
    .card-wrapper:active { cursor: grabbing; }
    .cdk-drag-placeholder {
      opacity: 0.3;
      border: 2px dashed #94a3b8;
      border-radius: 8px;
      min-height: 60px;
    }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
    .column-cards.cdk-drop-list-dragging .card-wrapper:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .empty-column { color: #94a3b8; text-align: center; padding: 2rem 0; font-size: 0.875rem; margin: 0; }
    .add-card-btn {
      background: transparent;
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 0.5rem;
      cursor: pointer;
      color: #64748b;
      margin-top: 0.5rem;
      text-align: left;
      font-size: 0.875rem;
    }
    .add-card-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .add-card-form input,
    .add-card-form textarea {
      padding: 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.875rem;
      font-family: inherit;
    }
    .add-card-form textarea { resize: vertical; }
    .form-actions { display: flex; gap: 0.5rem; }
  `]
})
export class ColumnComponent {
  @Input({ required: true }) column!: BoardColumn;
  @Input({ required: true }) cards: Card[] = [];
  @Input() labels: Label[] = [];
  @Input() columnIds: string[] = [];

  @Output() cardMoved = new EventEmitter<{ cardId: number; targetColumnId: number; targetPosition: number }>();
  @Output() cardUpdated = new EventEmitter<{ card: Card; action: 'save' | 'delete' }>();
  @Output() cardCreated = new EventEmitter<void>();

  showAddForm = signal(false);
  newCardTitle = '';
  newCardDesc = '';
  newCardAssignee = '';

  private cardService = inject(CardService);

  onDrop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const card = event.item.data as Card;
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.cardMoved.emit({
        cardId: card.id,
        targetColumnId: this.column.id,
        targetPosition: event.currentIndex
      });
    }
  }

  addCard(): void {
    if (!this.newCardTitle.trim()) return;

    const boardId = this.column.board_id;
    this.cardService.createCard({
      board_id: boardId,
      column_id: this.column.id,
      title: this.newCardTitle,
      description: this.newCardDesc || undefined,
      assignee: this.newCardAssignee || undefined
    }).subscribe(() => {
      this.newCardTitle = '';
      this.newCardDesc = '';
      this.newCardAssignee = '';
      this.showAddForm.set(false);
      this.cardCreated.emit();
    });
  }

  onCardUpdated(event: { card: Card; action: 'save' | 'delete' }): void {
    this.cardUpdated.emit(event);
  }
}
