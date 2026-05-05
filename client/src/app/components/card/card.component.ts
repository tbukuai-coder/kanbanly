import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card } from '../../models/card.model';
import { Label } from '../../models/label.model';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      @if (card.labels && card.labels.length) {
        <div class="card-labels">
          @for (label of card.labels; track label.id) {
            <span class="label-badge" [style.background]="label.color">{{ label.name }}</span>
          }
        </div>
      }

      <h4 class="card-title">{{ card.title }}</h4>

      @if (card.description) {
        <p class="card-description">{{ card.description }}</p>
      }

      <div class="card-meta">
        @if (card.assignee) {
          <span class="card-assignee">👤 {{ card.assignee }}</span>
        }
        @if (card.due_date) {
          <span class="card-due-date">📅 {{ card.due_date }}</span>
        }
      </div>

      <button class="edit-btn" (click)="startEdit()">Edit</button>
    </div>

    @if (editing()) {
      <div class="card-edit-modal" (click)="cancelEdit()">
        <div class="card-edit-form" (click)="$event.stopPropagation()">
          <h4>Edit Card</h4>
          <label>
            Title
            <input type="text" [(ngModel)]="editTitle" name="title" />
          </label>
          <label>
            Description
            <textarea [(ngModel)]="editDescription" name="description" rows="3"></textarea>
          </label>
          <label>
            Assignee
            <input type="text" [(ngModel)]="editAssignee" name="assignee" />
          </label>
          <label>
            Due Date
            <input type="date" [(ngModel)]="editDueDate" name="dueDate" />
          </label>
          <div class="edit-actions">
            <button class="btn-primary" (click)="saveEdit()">Save</button>
            <button class="btn-secondary" (click)="cancelEdit()">Cancel</button>
            <button class="btn-danger" (click)="deleteCard()">Delete</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .card {
      background: white;
      border-radius: 8px;
      padding: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    .card-labels {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }
    .label-badge {
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    .card-title {
      margin: 0 0 0.25rem;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .card-description {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      color: #64748b;
      line-height: 1.4;
    }
    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.7rem;
      color: #94a3b8;
    }
    .edit-btn {
      display: none;
      margin-top: 0.5rem;
      background: transparent;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      font-size: 0.75rem;
      color: #64748b;
      width: 100%;
    }
    .edit-btn:hover { background: #f1f5f9; }
    .card:hover .edit-btn { display: block; }
    .card-edit-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .card-edit-form {
      background: white;
      border-radius: 10px;
      padding: 1.5rem;
      width: 400px;
      max-width: 90vw;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .card-edit-form h4 { margin: 0 0 0.5rem; }
    .card-edit-form label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }
    .card-edit-form input,
    .card-edit-form textarea {
      padding: 0.5rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.875rem;
      font-family: inherit;
    }
    .edit-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      margin-left: auto;
    }
    .btn-danger:hover { background: #dc2626; }
  `]
})
export class CardComponent {
  @Input({ required: true }) card!: Card;
  @Input() labels: Label[] = [];

  @Output() updated = new EventEmitter<{ card: Card; action: 'save' | 'delete' }>();

  editing = signal(false);
  editTitle = '';
  editDescription = '';
  editAssignee = '';
  editDueDate = '';

  startEdit(): void {
    this.editTitle = this.card.title;
    this.editDescription = this.card.description || '';
    this.editAssignee = this.card.assignee || '';
    this.editDueDate = this.card.due_date || '';
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveEdit(): void {
    this.updated.emit({
      card: {
        ...this.card,
        title: this.editTitle,
        description: this.editDescription || null,
        assignee: this.editAssignee || null,
        due_date: this.editDueDate || null
      },
      action: 'save'
    });
    this.editing.set(false);
  }

  deleteCard(): void {
    this.updated.emit({ card: this.card, action: 'delete' });
    this.editing.set(false);
  }
}
