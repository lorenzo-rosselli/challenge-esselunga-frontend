import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CampoIndirizzo } from '../../components/campo-indirizzo/campo-indirizzo';
import { Articolo, CreazioneSpesa, Magazzino } from '../../core/models';
import { ArticoloService } from '../../core/services/articolo.service';
import { SuggerimentoIndirizzo } from '../../core/services/geocodifica.service';
import { MagazzinoService } from '../../core/services/magazzino.service';
import { SpesaService } from '../../core/services/spesa.service';
import { messaggiErrore } from '../../shared/messaggi-errore';

/** Riga del riepilogo: articolo scelto, quantita' e importo di anteprima. */
interface RigaRiepilogo {
  articolo: Articolo;
  quantita: number;
  importo: number;
}

/** Testo non vuoto (non solo spazi), come @NotBlank del backend. */
const NON_VUOTO = /\S/;

/**
 * UC1 - Creazione di una spesa.
 * <p>
 * L'utente inserisce i dati di consegna, sceglie il magazzino e gli articoli con le quantita'.
 * Al backend vengono inviati solo i campi previsti da POST /spese: nome e prezzo degli articoli
 * e i totali sono calcolati dal backend. Il totale mostrato qui e' solo un'anteprima.
 */
@Component({
  selector: 'app-nuova-spesa',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, CampoIndirizzo],
  templateUrl: './nuova-spesa.html',
  styleUrl: './nuova-spesa.css',
})
export class NuovaSpesa implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly spesaService = inject(SpesaService);
  private readonly magazzinoService = inject(MagazzinoService);
  private readonly articoloService = inject(ArticoloService);

  /**
   * Dati di consegna: stessi vincoli della validazione del backend.
   * Indirizzo, latitudine e longitudine sono valorizzati insieme quando l'utente sceglie
   * un indirizzo dai suggerimenti; le coordinate non sono mostrate.
   */
  protected readonly form = this.fb.nonNullable.group({
    nomeCliente: ['', [Validators.required, Validators.pattern(NON_VUOTO)]],
    indirizzoConsegna: ['', [Validators.required, Validators.pattern(NON_VUOTO)]],
    latitudine: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(-90),
      Validators.max(90),
    ]),
    longitudine: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(-180),
      Validators.max(180),
    ]),
    magazzinoId: ['', Validators.required],
  });

  protected readonly magazzini = signal<Magazzino[]>([]);
  protected readonly articoli = signal<Articolo[]>([]);
  /** Quantita' scelta per ogni articolo (id articolo -> quantita'). */
  protected readonly quantita = signal<Record<string, number>>({});

  protected readonly caricamento = signal(true);
  protected readonly erroreCaricamento = signal(false);
  protected readonly invio = signal(false);
  protected readonly erroriInvio = signal<string[]>([]);
  protected readonly tentatoInvio = signal(false);

  /** Indirizzo scelto (o annullato) nel campo con i suggerimenti. */
  protected indirizzoScelto(scelta: SuggerimentoIndirizzo | null): void {
    this.form.patchValue({
      indirizzoConsegna: scelta?.indirizzo ?? '',
      latitudine: scelta?.posizione.latitudine ?? null,
      longitudine: scelta?.posizione.longitudine ?? null,
    });
  }

  /** L'indirizzo non e' valido finche' non e' stato scelto dai suggerimenti (coordinate presenti). */
  protected indirizzoNonValido(): boolean {
    const controlli = this.form.controls;
    const nonValido =
      controlli.indirizzoConsegna.invalid || controlli.latitudine.invalid || controlli.longitudine.invalid;
    return nonValido && (controlli.indirizzoConsegna.touched || this.tentatoInvio());
  }

  protected readonly riepilogo = computed<RigaRiepilogo[]>(() =>
    this.articoli()
      .filter((articolo) => (this.quantita()[articolo.id] ?? 0) > 0)
      .map((articolo) => {
        const quantita = this.quantita()[articolo.id];
        // calcolo in centesimi per evitare errori di arrotondamento dei decimali
        return { articolo, quantita, importo: (Math.round(articolo.prezzo * 100) * quantita) / 100 };
      }),
  );

  protected readonly totaleAnteprima = computed(
    () => this.riepilogo().reduce((somma, riga) => somma + Math.round(riga.importo * 100), 0) / 100,
  );

  protected readonly numeroPezzi = computed(() =>
    this.riepilogo().reduce((somma, riga) => somma + riga.quantita, 0),
  );

  ngOnInit(): void {
    this.carica();
  }

  protected carica(): void {
    this.caricamento.set(true);
    this.erroreCaricamento.set(false);

    forkJoin({ magazzini: this.magazzinoService.lista(), articoli: this.articoloService.lista() }).subscribe({
      next: ({ magazzini, articoli }) => {
        this.magazzini.set(magazzini);
        this.articoli.set(articoli);
        this.caricamento.set(false);
      },
      error: () => {
        this.erroreCaricamento.set(true);
        this.caricamento.set(false);
      },
    });
  }

  protected quantitaDi(articolo: Articolo): number {
    return this.quantita()[articolo.id] ?? 0;
  }

  protected aggiungi(articolo: Articolo): void {
    this.impostaQuantita(articolo, this.quantitaDi(articolo) + 1);
  }

  protected togli(articolo: Articolo): void {
    this.impostaQuantita(articolo, this.quantitaDi(articolo) - 1);
  }

  /** Quantita' digitata a mano: solo numeri interi, minimo 0. */
  protected quantitaDigitata(articolo: Articolo, valore: string): void {
    const numero = Number.parseInt(valore, 10);
    this.impostaQuantita(articolo, Number.isNaN(numero) ? 0 : numero);
  }

  private impostaQuantita(articolo: Articolo, quantita: number): void {
    const intera = Math.max(0, Math.trunc(quantita));
    this.quantita.update((attuali) => {
      const nuove = { ...attuali };
      if (intera > 0) {
        nuove[articolo.id] = intera;
      } else {
        delete nuove[articolo.id];
      }
      return nuove;
    });
  }

  /** Campo da evidenziare come non valido. */
  protected nonValido(campo: keyof typeof this.form.controls): boolean {
    const controllo = this.form.controls[campo];
    return controllo.invalid && (controllo.touched || this.tentatoInvio());
  }

  protected crea(): void {
    this.tentatoInvio.set(true);
    this.erroriInvio.set([]);
    if (this.form.invalid || this.riepilogo().length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const valori = this.form.getRawValue();
    // Richiesta con i soli campi e i tipi previsti dal backend (numeri come number, id come stringhe)
    const richiesta: CreazioneSpesa = {
      nomeCliente: valori.nomeCliente.trim(),
      indirizzoConsegna: valori.indirizzoConsegna.trim(),
      posizioneConsegna: {
        latitudine: Number(valori.latitudine),
        longitudine: Number(valori.longitudine),
      },
      magazzinoId: valori.magazzinoId,
      articoli: this.riepilogo().map((riga) => ({
        articoloId: riga.articolo.id,
        quantita: riga.quantita,
      })),
    };

    this.invio.set(true);
    this.spesaService.crea(richiesta).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (errore: HttpErrorResponse) => {
        this.erroriInvio.set(messaggiErrore(errore));
        this.invio.set(false);
      },
    });
  }
}
