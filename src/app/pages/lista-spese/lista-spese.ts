import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModificaSpesaModale } from '../../components/modifica-spesa/modifica-spesa';
import { forkJoin } from 'rxjs';
import { Magazzino, Spesa, StatoSpesa } from '../../core/models';
import { MagazzinoService } from '../../core/services/magazzino.service';
import { SpesaService } from '../../core/services/spesa.service';
import { messaggiErrore } from '../../shared/messaggi-errore';
import { STATI_SPESA } from '../../shared/stato-spesa';

/** Colonne su cui e' possibile ordinare la tabella. */
type ColonnaOrdinabile = 'dataCreazione' | 'magazzino' | 'totale';

/** Criterio di ordinamento: colonna e direzione. */
interface Ordinamento {
  colonna: ColonnaOrdinabile;
  direzione: 'asc' | 'desc';
}

/**
 * Homepage: tabella con la lista di tutte le spese create.
 * <p>
 * Filtri (stato, cliente) e ordinamenti (data e ora, magazzino, totale) sono applicati nel frontend
 * sulla lista completa restituita dal backend. Gli ordinamenti sono sovrapponibili: l'ultima colonna
 * scelta diventa il criterio principale e le precedenti restano come criteri secondari.
 */
@Component({
  selector: 'app-lista-spese',
  imports: [RouterLink, CurrencyPipe, DatePipe, ModificaSpesaModale],
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
  /** Id della spesa di cui e' in corso l'avanzamento di stato. */
  protected readonly inAvanzamento = signal<string | null>(null);
  /** Spesa aperta nella modale di modifica (null = modale chiusa). */
  protected readonly spesaInModifica = signal<Spesa | null>(null);
  /** Messaggio di errore dell'ultima azione sulla tabella. */
  protected readonly erroreAzione = signal<string | null>(null);

  /** Filtro per stato ('' = tutti gli stati). */
  protected readonly filtroStato = signal<StatoSpesa | ''>('');
  /** Filtro sul nome del cliente (ricerca per testo contenuto, senza distinzione di maiuscole). */
  protected readonly filtroCliente = signal('');
  /** Criteri di ordinamento in ordine di priorita' (il primo e' il principale). */
  protected readonly ordinamenti = signal<Ordinamento[]>([]);

  protected readonly elencoStati = Object.keys(STATI_SPESA) as StatoSpesa[];

  /** Nome del magazzino per id, per mostrarlo in tabella al posto dell'identificativo. */
  protected readonly nomiMagazzini = computed(
    () => new Map(this.magazzini().map((magazzino) => [magazzino.id, magazzino.nome])),
  );

  /** Spese da mostrare: filtrate e ordinate secondo le scelte dell'utente. */
  protected readonly speseVisualizzate = computed(() => {
    const stato = this.filtroStato();
    const cliente = this.filtroCliente().trim().toLowerCase();
    const ordinamenti = this.ordinamenti();

    const filtrate = this.spese().filter(
      (spesa) =>
        (stato === '' || spesa.stato === stato) &&
        (cliente === '' || spesa.nomeCliente.toLowerCase().includes(cliente)),
    );

    if (ordinamenti.length === 0) {
      return filtrate; // ordine del backend: dalla spesa piu' recente
    }
    return [...filtrate].sort((a, b) => {
      for (const ordinamento of ordinamenti) {
        const confronto = this.confronta(a, b, ordinamento.colonna);
        if (confronto !== 0) {
          return ordinamento.direzione === 'asc' ? confronto : -confronto;
        }
      }
      return 0;
    });
  });

  protected readonly filtriAttivi = computed(
    () => this.filtroStato() !== '' || this.filtroCliente().trim() !== '',
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

  /**
   * Clic sull'intestazione di una colonna ordinabile:
   * - colonna non ordinata: diventa il criterio principale, crescente;
   * - colonna gia' ordinata in modo crescente: passa a decrescente, mantenendo la sua priorita';
   * - colonna gia' ordinata in modo decrescente: viene tolta dall'ordinamento.
   */
  protected ordinaPer(colonna: ColonnaOrdinabile): void {
    this.ordinamenti.update((attuali) => {
      const esistente = attuali.find((ordinamento) => ordinamento.colonna === colonna);
      if (!esistente) {
        return [{ colonna, direzione: 'asc' }, ...attuali];
      }
      if (esistente.direzione === 'asc') {
        return attuali.map((ordinamento) =>
          ordinamento.colonna === colonna ? { colonna, direzione: 'desc' } : ordinamento,
        );
      }
      return attuali.filter((ordinamento) => ordinamento.colonna !== colonna);
    });
  }

  /** Criterio di ordinamento della colonna, con la sua priorita' (1 = principale). */
  protected statoOrdinamento(colonna: ColonnaOrdinabile): { direzione: 'asc' | 'desc'; priorita: number } | null {
    const indice = this.ordinamenti().findIndex((ordinamento) => ordinamento.colonna === colonna);
    return indice < 0 ? null : { direzione: this.ordinamenti()[indice].direzione, priorita: indice + 1 };
  }

  /** Valore dell'attributo aria-sort per l'accessibilita'. */
  protected ariaSort(colonna: ColonnaOrdinabile): string {
    const stato = this.statoOrdinamento(colonna);
    return stato ? (stato.direzione === 'asc' ? 'ascending' : 'descending') : 'none';
  }

  protected azzeraFiltri(): void {
    this.filtroStato.set('');
    this.filtroCliente.set('');
  }

  private confronta(a: Spesa, b: Spesa, colonna: ColonnaOrdinabile): number {
    switch (colonna) {
      case 'dataCreazione':
        return Date.parse(a.dataCreazione) - Date.parse(b.dataCreazione);
      case 'totale':
        return a.totale - b.totale;
      case 'magazzino':
        return (this.nomiMagazzini().get(a.magazzinoId) ?? '').localeCompare(
          this.nomiMagazzini().get(b.magazzinoId) ?? '',
          'it',
        );
    }
  }

  /** Testo del tooltip del bottone di cambio stato. */
  protected descrizioneAvanzamento(spesa: Spesa): string {
    const successivo = this.stati[spesa.stato].successivo;
    return successivo
      ? `Avanza allo stato "${this.stati[successivo].etichetta}"`
      : 'La spesa è già consegnata';
  }

  /** Testo del tooltip del bottone di modifica. */
  protected descrizioneModifica(spesa: Spesa): string {
    return this.stati[spesa.stato].modificabile
      ? 'Modifica la spesa'
      : 'Non modificabile: la spesa è già partita o pronta per la consegna';
  }

  protected apriModifica(spesa: Spesa): void {
    this.erroreAzione.set(null);
    this.spesaInModifica.set(spesa);
  }

  /** Spesa salvata nella modale: si aggiorna la riga e si chiude la modale. */
  protected modificaSalvata(aggiornata: Spesa): void {
    this.spese.update((spese) => spese.map((s) => (s.id === aggiornata.id ? aggiornata : s)));
    this.spesaInModifica.set(null);
  }

  /** Fa avanzare la spesa allo stato successivo e aggiorna la riga con la risposta del backend. */
  protected avanzaStato(spesa: Spesa): void {
    this.erroreAzione.set(null);
    this.inAvanzamento.set(spesa.id);

    this.spesaService.avanzaStato(spesa.id, spesa.versione).subscribe({
      next: (aggiornata) => {
        this.spese.update((spese) => spese.map((s) => (s.id === aggiornata.id ? aggiornata : s)));
        this.inAvanzamento.set(null);
      },
      error: (errore: HttpErrorResponse) => {
        this.erroreAzione.set(messaggiErrore(errore).join(' '));
        this.inAvanzamento.set(null);
        // la spesa potrebbe essere cambiata nel frattempo: si ricarica la lista aggiornata
        if (errore.status === 409) {
          this.carica();
        }
      },
    });
  }
}
