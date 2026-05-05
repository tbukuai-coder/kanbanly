import { Component, Output, EventEmitter, signal, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-bar">
      <input
        type="text"
        [ngModel]="query()"
        (ngModelChange)="onInput($event)"
        placeholder="Search cards..."
        class="search-input"
      />
      @if (query()) {
        <button class="clear-btn" (click)="clear()">&times;</button>
      }
    </div>
  `,
  styles: [`
    .search-bar {
      position: relative;
      display: inline-block;
    }
    .search-input {
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.875rem;
      width: 240px;
      font-family: inherit;
    }
    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .clear-btn {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: #94a3b8;
      padding: 0 0.25rem;
      line-height: 1;
    }
    .clear-btn:hover { color: #475569; }
  `]
})
export class SearchBarComponent {
  @Output() searchChange = new EventEmitter<string>();

  query = signal('');

  private searchSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);

  constructor() {
    const sub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      this.searchChange.emit(q);
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  onInput(value: string): void {
    this.query.set(value);
    this.searchSubject.next(value);
  }

  clear(): void {
    this.query.set('');
    this.searchSubject.next('');
  }
}
