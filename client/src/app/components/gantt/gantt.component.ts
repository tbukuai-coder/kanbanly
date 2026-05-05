import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { BoardDetail } from '../../models/board.model';
import type Gantt from 'frappe-gantt';

@Component({
  selector: 'app-gantt',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="gantt-view">
      <div class="gantt-header">
        <a [routerLink]="['/boards', board()?.id]" class="back-link">&larr; Board View</a>
        <h2>{{ board()?.name }} — Gantt Chart</h2>
        <div class="view-toggle">
          <a [routerLink]="['/boards', board()?.id]" class="btn">Kanban</a>
          <a class="btn active">Gantt</a>
        </div>
      </div>
      @if (board(); as b) {
        <div class="gantt-wrapper" #ganttContainer>
          @if (taskList().length === 0) {
            <p class="empty">No cards on this board yet. Add cards from the Kanban view first.</p>
          }
        </div>
      } @else {
        <p class="loading">Loading...</p>
      }
    </div>
  `,
  styles: [`
    .gantt-view { padding: 1rem; }
    .gantt-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .back-link { color: #3b82f6; text-decoration: none; font-size: 0.875rem; }
    .gantt-header h2 { margin: 0; font-size: 1.25rem; flex: 1; }
    .view-toggle { display: flex; gap: 0.25rem; background: #f1f5f9; border-radius: 6px; padding: 2px; }
    .view-toggle .btn { padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem; text-decoration: none; color: #64748b; }
    .view-toggle .btn.active { background: #fff; color: #1e293b; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .gantt-wrapper { overflow: auto; border: 1px solid #e2e8f0; border-radius: 8px; min-height: 300px; background: #fff; }
    .empty { text-align: center; padding: 3rem; color: #94a3b8; }
    .loading { text-align: center; padding: 3rem; color: #94a3b8; }
    ::ng-deep .gantt .bar-label { font-size: 11px; }
    ::ng-deep .gantt-container { font-family: inherit; }
  `]
})
export class GanttComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private boardService = inject(BoardService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('ganttContainer') ganttContainer!: ElementRef;

  board = signal<BoardDetail | null>(null);
  taskList = signal<Gantt.Task[]>([]);

  private ganttInstance: InstanceType<typeof Gantt> | null = null;
  private boardLoaded = false;
  private renderPending = false;
  private scriptLoaded = false;

  ngOnInit(): void {
    const boardId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadScript().then(() => {
      this.scriptLoaded = true;
      this.loadBoard(boardId);
    });
  }

  ngAfterViewInit(): void {
    this.tryRender();
  }

  ngAfterViewChecked(): void {
    if (this.renderPending && this.ganttContainer) {
      this.renderPending = false;
      this.tryRender();
    }
  }

  ngOnDestroy(): void {
    if (this.ganttInstance) {
      this.ganttInstance.clear();
      this.ganttInstance = null;
    }
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && 'Gantt' in window) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'assets/frappe-gantt.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load frappe-gantt'));
      document.head.appendChild(script);
    });
  }

  private loadBoard(id: number): void {
    this.boardService.getBoardDetail(id).subscribe(board => {
      this.board.set(board);
      this.taskList.set(this.mapCardsToTasks(board));
      this.boardLoaded = true;
      if (!this.ganttContainer) {
        this.renderPending = true;
        this.cdr.detectChanges();
      } else {
        this.tryRender();
      }
    });
  }

  private tryRender(): void {
    if (!this.boardLoaded) return;
    if (!this.scriptLoaded) return;
    if (!this.ganttContainer) return;
    const tasks = this.taskList();
    if (tasks.length > 0) {
      this.renderGantt(tasks);
    }
  }

  private mapCardsToTasks(board: BoardDetail): Gantt.Task[] {
    const columnColors: Record<number, string> = {};
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    board.columns.forEach((col, i) => {
      columnColors[col.id] = palette[i % palette.length];
    });

    return board.cards.map(card => {
      const hasDue = !!card.due_date;
      const endDate = hasDue
        ? new Date(card.due_date!)
        : this.addDays(new Date(card.created_at), 1);
      const startDate = hasDue
        ? this.addDays(new Date(card.due_date!), -3)
        : new Date(card.created_at);
      return {
        id: `card-${card.id}`,
        name: card.title,
        start: this.formatDate(startDate),
        end: this.formatDate(endDate),
        progress: this.getProgressForColumn(card.column_id, board.columns),
        custom_class: `col-${card.column_id}`,
        color: columnColors[card.column_id] || '#6b7280',
      } as Gantt.Task;
    });
  }

  private getProgressForColumn(columnId: number, columns: { id: number }[]): number {
    const idx = columns.findIndex(c => c.id === columnId);
    if (idx === -1) return 0;
    const total = columns.length;
    if (total <= 1) return 100;
    return Math.round(((idx + 1) / total) * 100);
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private renderGantt(tasks: Gantt.Task[]): void {
    if (this.ganttInstance) {
      this.ganttInstance.clear();
      this.ganttInstance = null;
    }
    this.ganttContainer.nativeElement.innerHTML = '';
    const GanttLib = (window as any).Gantt;
    if (!GanttLib) {
      console.error('frappe-gantt not loaded');
      return;
    }
    this.ganttInstance = new GanttLib(this.ganttContainer.nativeElement, tasks, {
      view_mode: 'Week',
      date_format: 'YYYY-MM-DD',
      bar_height: 25,
      padding: 18,
      popup: true,
      on_click: (task: Gantt.Task) => {
        const cardId = Number(task.id?.replace('card-', ''));
        if (cardId) {
          window.location.href = `/boards/${this.board()?.id}`;
        }
      },
    });
  }
}
