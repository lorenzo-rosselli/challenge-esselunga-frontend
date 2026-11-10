import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import {
  GeocodificaService,
  SuggerimentoIndirizzo,
} from '../../core/services/geocodifica.service';

/** Numero minimo di caratteri prima di cercare i suggerimenti. */
const CARATTERI_MINIMI = 3;

/**
 * Campo di inserimento dell'indirizzo con suggerimenti durante la digitazione.
 * <p>
 * Quando l'utente sceglie un suggerimento, il componente emette l'indirizzo con le sue coordinate:
 * le coordinate non vengono mostrate. Se il testo viene modificato dopo la scelta, l'indirizzo
 * torna "non selezionato" (emette null), cosi' indirizzo e coordinate restano sempre coerenti.
 */
@Component({
  selector: 'app-campo-indirizzo',
  templateUrl: './campo-indirizzo.html',
  styleUrl: './campo-indirizzo.css',
})
export class CampoIndirizzo implements OnInit {
  private readonly geocodifica = inject(GeocodificaService);

  /** Id del campo, per collegarlo alla sua etichetta. */
  readonly idCampo = input('indirizzo');
  /** Evidenzia il campo come non valido. */
  readonly nonValido = input(false);
  /** Indirizzo gia' presente all'apertura (es. in modifica): considerato gia' scelto. */
  readonly valoreIniziale = input('');

  /** Indirizzo scelto dai suggerimenti, oppure null se il testo non corrisponde a una scelta. */
  readonly indirizzoScelto = output<SuggerimentoIndirizzo | null>();
  /** Il campo ha perso il focus (per mostrare gli errori solo dopo l'interazione). */
  readonly toccato = output<void>();

  protected readonly testo = signal('');
  protected readonly suggerimenti = signal<SuggerimentoIndirizzo[]>([]);
  protected readonly aperto = signal(false);
  protected readonly ricerca = signal(false);
  protected readonly erroreServizio = signal(false);
  /** Suggerimento evidenziato con le frecce della tastiera (-1 = nessuno). */
  protected readonly evidenziato = signal(-1);

  private readonly digitazione = new Subject<string>();

  constructor() {
    this.digitazione
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.erroreServizio.set(false)),
        switchMap((testo) => {
          if (testo.length < CARATTERI_MINIMI) {
            return of<SuggerimentoIndirizzo[]>([]);
          }
          this.ricerca.set(true);
          return this.geocodifica.cerca(testo).pipe(
            catchError(() => {
              this.erroreServizio.set(true);
              return of<SuggerimentoIndirizzo[]>([]);
            }),
          );
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((suggerimenti) => {
        this.ricerca.set(false);
        this.suggerimenti.set(suggerimenti);
        this.evidenziato.set(-1);
        this.aperto.set(true);
      });
  }

  ngOnInit(): void {
    this.testo.set(this.valoreIniziale());
  }

  protected digita(valore: string): void {
    this.testo.set(valore);
    this.indirizzoScelto.emit(null); // il testo non corrisponde piu' a un indirizzo scelto
    this.digitazione.next(valore.trim());
  }

  protected scegli(suggerimento: SuggerimentoIndirizzo): void {
    this.testo.set(suggerimento.indirizzo);
    this.suggerimenti.set([]);
    this.aperto.set(false);
    this.indirizzoScelto.emit(suggerimento);
  }

  protected tasto(evento: KeyboardEvent): void {
    const elenco = this.suggerimenti();
    if (!this.aperto() || elenco.length === 0) {
      return;
    }
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      this.evidenziato.update((i) => (i + 1) % elenco.length);
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      this.evidenziato.update((i) => (i <= 0 ? elenco.length - 1 : i - 1));
    } else if (evento.key === 'Enter' && this.evidenziato() >= 0) {
      evento.preventDefault(); // non invia il form
      this.scegli(elenco[this.evidenziato()]);
    } else if (evento.key === 'Escape') {
      this.aperto.set(false);
    }
  }

  protected uscita(): void {
    this.aperto.set(false);
    this.toccato.emit();
  }
}
