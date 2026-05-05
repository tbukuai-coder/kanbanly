import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Board, BoardDetail } from '../models/board.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BoardService {
  constructor(private api: ApiService) {}

  getBoards(): Observable<Board[]> {
    return this.api.get<Board[]>('/boards');
  }

  getBoardDetail(id: number): Observable<BoardDetail> {
    return this.api.get<BoardDetail>(`/boards/${id}`);
  }

  createBoard(data: { name: string; description?: string }): Observable<Board> {
    return this.api.post<Board>('/boards', data);
  }

  updateBoard(id: number, data: { name?: string; description?: string }): Observable<Board> {
    return this.api.put<Board>(`/boards/${id}`, data);
  }

  deleteBoard(id: number): Observable<void> {
    return this.api.delete<void>(`/boards/${id}`);
  }
}
