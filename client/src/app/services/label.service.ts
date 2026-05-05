import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Label } from '../models/label.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LabelService {
  constructor(private api: ApiService) {}

  getLabels(boardId: number): Observable<Label[]> {
    return this.api.get<Label[]>('/labels', { board_id: boardId });
  }

  createLabel(data: { board_id: number; name: string; color?: string }): Observable<Label> {
    return this.api.post<Label>('/labels', data);
  }

  deleteLabel(id: number): Observable<void> {
    return this.api.delete<void>(`/labels/${id}`);
  }
}
