import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface VoceMenu {
  etichetta: string;
  icona: string;
  link: string;
}

/**
 * Menu di navigazione laterale.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  protected readonly voci: VoceMenu[] = [
    { etichetta: 'Spese', icona: 'bi-list-ul', link: '/' },
    { etichetta: 'Percorsi di consegna', icona: 'bi-geo-alt', link: '/percorsi' },
  ];
}
