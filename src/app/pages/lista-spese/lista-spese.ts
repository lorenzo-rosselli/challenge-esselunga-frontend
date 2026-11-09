import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Magazzino, Spesa } from '../../core/models';
import { MagazzinoService } from '../../core/services/magazzino.service';
import { SpesaService } from '../../core/services/spesa.service';
import { STATI_SPESA } from '../../shared/stato-spesa';

/**
 * Homepage: tabella con la lista di tutte le spese create.
 */
@Component({
  selector: 'app-lista-spese',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './lista-spese.html',
  styleUrl: './lista-spese.css',
})
export class ListaSpese implements OnInit {
  private readonly spesaService = inject(SpesaService);
  private readonly magazzinoService = inject(MagazzinoService);

  protected readonly stati = STATI_SPESA;
  protected readonly spese = signal<Spesa[]>([]);
  protected readonly magazzini = signal<Magazzino[]>([]);
  protected readonly caricamento = signal(true);
  protected readonly errore = signal(false);

  /** Nome del magazzino per id, per mostrarlo in tabella al posto dell'identificativo. */
  protected readonly nomiMagazzini = computed(
    () => new Map(this.magazzini().map((magazzino) => [magazzino.id, magazzino.nome])),
  );

  ngOnInit(): void {
    this.carica();
  }

  protected carica(): void {
    this.caricamento.set(true);
    this.errore.set(false);

    forkJoin({ spese: this.spesaService.lista(), magazzini: this.magazzinoService.lista() }).subscribe({
      next: ({ spese, magazzini }) => {
        this.spese.set(spese);
        this.magazzini.set(magazzini);
        this.caricamento.set(false);
      },
      error: () => {
        this.errore.set(true);
        this.caricamento.set(false);
      },
    });
  }

  /** Numero totale di pezzi della spesa. */
  protected numeroArticoli(spesa: Spesa): number {
    return spesa.articoli.reduce((somma, elemento) => somma + elemento.quantita, 0);
  }
}
