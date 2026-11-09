import { Routes } from '@angular/router';
import { ListaSpese } from './pages/lista-spese/lista-spese';
import { NuovaSpesa } from './pages/nuova-spesa/nuova-spesa';

export const routes: Routes = [
  { path: '', component: ListaSpese, title: 'Spese - Gestione Spese Online' },
  { path: 'spese/nuova', component: NuovaSpesa, title: 'Nuova spesa - Gestione Spese Online' },
  {
    path: 'percorsi',
    // caricata solo quando serve: la libreria della mappa non pesa sulle altre pagine
    loadComponent: () =>
      import('./pages/percorsi-consegna/percorsi-consegna').then((m) => m.PercorsiConsegna),
    title: 'Percorsi di consegna - Gestione Spese Online',
  },
  // Percorsi non ancora previsti: si torna alla homepage
  { path: '**', redirectTo: '' },
];
