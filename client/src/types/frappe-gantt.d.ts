import Gantt from 'frappe-gantt';

declare global {
  interface Window {
    Gantt: typeof Gantt;
  }
  const Gantt: typeof Gantt;
}

export {};
