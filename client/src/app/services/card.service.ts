import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Card, CardMoveRequest } from '../models/card.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CardService {
  constructor(private api: ApiService) {}

  getCards(boardId: number, query?: string): Observable<Card[]> {
    const params: Record<string, string | number> = { board_id: boardId };
    if (query) params['q'] = query;
    return this.api.get<Card[]>('/cards', params);
  }

  createCard(card: Partial<Card>): Observable<Card> {
    return this.api.post<Card>('/cards', card);
  }

  updateCard(id: number, updates: Partial<Card>): Observable<Card> {
    return this.api.put<Card>(`/cards/${id}`, updates);
  }

  moveCard(id: number, move: CardMoveRequest): Observable<Card> {
    return this.api.post<Card>(`/cards/${id}/move`, move);
  }

  deleteCard(id: number): Observable<void> {
    return this.api.delete<void>(`/cards/${id}`);
  }
}
