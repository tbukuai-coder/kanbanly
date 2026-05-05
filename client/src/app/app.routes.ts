import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/board/board-list.component').then(m => m.BoardListComponent) },
  { path: 'boards/:id', loadComponent: () => import('./components/board/board-detail.component').then(m => m.BoardDetailComponent) },
  { path: 'boards/:id/gantt', loadComponent: () => import('./components/gantt/gantt.component').then(m => m.GanttComponent) },
  { path: '**', redirectTo: '' }
];
