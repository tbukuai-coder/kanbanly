import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ActivityLog } from '../models/activity.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  constructor(private api: ApiService) {}

  getActivity(boardId: number, limit = 50, offset = 0): Observable<ActivityLog[]> {
    return this.api.get<ActivityLog[]>('/activity', { board_id: boardId, limit, offset });
  }
}
