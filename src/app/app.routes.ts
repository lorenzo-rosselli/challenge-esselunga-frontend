import { Routes } from '@angular/router';
import { ListaSpese } from './pages/lista-spese/lista-spese';

export const routes: Routes = [
  { path: '', component: ListaSpese, title: 'Spese - Gestione Spese Online' },
  // Percorsi non ancora previsti: si torna alla homepage
  { path: '**', redirectTo: '' },
];
