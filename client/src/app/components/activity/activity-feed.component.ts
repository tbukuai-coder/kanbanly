import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../services/activity.service';
import { ActivityLog } from '../../models/activity.model';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-feed">
      <h3>Activity</h3>
      @if (activities(); as acts) {
        @if (acts.length === 0) {
          <p class="empty">No activity yet.</p>
        } @else {
          <ul class="activity-list">
            @for (activity of acts; track activity.id) {
              <li class="activity-item">
                <span class="activity-action">{{ formatAction(activity) }}</span>
                <span class="activity-time">{{ activity.created_at | date:'short' }}</span>
              </li>
            }
          </ul>
        }
      } @else {
        <p class="loading">Loading activity...</p>
      }
    </div>
  `,
  styles: [`
    .activity-feed {
      margin-top: 2rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .activity-feed h3 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      font-weight: 600;
    }
    .activity-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
    }
    .activity-item {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.4rem 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.8rem;
    }
    .activity-action { color: #334155; }
    .activity-time { color: #94a3b8; white-space: nowrap; margin-left: 1rem; }
    .empty, .loading { color: #94a3b8; font-size: 0.875rem; }
  `]
})
export class ActivityFeedComponent implements OnInit {
  @Input({ required: true }) boardId!: number;

  activities = signal<ActivityLog[] | null>(null);

  private activityService = inject(ActivityService);

  ngOnInit(): void {
    this.activityService.getActivity(this.boardId).subscribe(
      data => this.activities.set(data)
    );
  }

  formatAction(activity: ActivityLog): string {
    switch (activity.action) {
      case 'card.created':
        return `Card created: "${activity.details}"`;
      case 'card.moved':
        return `Card moved: "${activity.details}"`;
      case 'card.updated':
        return `Card updated: "${activity.details}"`;
      case 'card.deleted':
        return `Card deleted: "${activity.details}"`;
      case 'board.created':
        return `Board created: "${activity.details}"`;
      case 'column.created':
        return `Column created: "${activity.details}"`;
      default:
        return `${activity.action}: ${activity.details}`;
    }
  }
}
