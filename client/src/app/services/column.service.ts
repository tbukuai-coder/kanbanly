import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BoardColumn } from '../models/column.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ColumnService {
  constructor(private api: ApiService) {}

  createColumn(data: { board_id: number; name: string; position?: number }): Observable<BoardColumn> {
    return this.api.post<BoardColumn>('/columns', data);
  }

  updateColumn(id: number, data: { name?: string; position?: number }): Observable<BoardColumn> {
    return this.api.put<BoardColumn>(`/columns/${id}`, data);
  }

  deleteColumn(id: number): Observable<void> {
    return this.api.delete<void>(`/columns/${id}`);
  }

  reorderColumns(columns: { id: number; position: number }[]): Observable<{ success: boolean }> {
    return this.api.post<{ success: boolean }>('/columns/reorder', { columns });
  }
}
