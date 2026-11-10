import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CampoIndirizzo } from '../campo-indirizzo/campo-indirizzo';
import { ModificaSpesa, Spesa } from '../../core/models';
import { SuggerimentoIndirizzo } from '../../core/services/geocodifica.service';
import { SpesaService } from '../../core/services/spesa.service';
import { messaggiErrore } from '../../shared/messaggi-errore';
import { STATI_SPESA } from '../../shared/stato-spesa';

/** Testo non vuoto (non solo spazi), come la validazione del backend. */
const NON_VUOTO = /\S/;

/**
 * UC2 - Modale di modifica di una spesa.
 * <p>
 * Mostra tutte le informazioni della spesa; sono modificabili solo il nome del cliente e i dati
 * di consegna (indirizzo e posizione, sempre insieme). Al backend vengono inviati solo i campi
 * cambiati, insieme alla versione letta, come previsto da PATCH /spese/{id}.
 * La pagina sottostante e' bloccata e sfocata finche' la modale e' aperta.
 */
@Component({
  selector: 'app-modifica-spesa',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, CampoIndirizzo],
  templateUrl: './modifica-spesa.html',
  styleUrl: './modifica-spesa.css',
  host: { '(document:keydown.escape)': 'chiudi()' },
})
export class ModificaSpesaModale implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly document = inject(DOCUMENT);
  private readonly spesaService = inject(SpesaService);

  /** Spesa da modificare. */
  readonly spesa = input.required<Spesa>();
  /** Nome del magazzino di partenza, solo da visualizzare. */
  readonly nomeMagazzino = input<string>('-');

  /** Chiusura senza salvataggio. */
  readonly chiusa = output<void>();
  /** Spesa salvata: restituisce la versione aggiornata dal backend. */
  readonly salvata = output<Spesa>();

  protected readonly stati = STATI_SPESA;

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
  });

  /** Valori del form aggiornati a ogni modifica, per sapere cosa e' cambiato. */
  private readonly valori = signal(this.form.getRawValue());

  protected readonly nomeCambiato = computed(
    () => this.valori().nomeCliente.trim() !== this.spesa().nomeCliente,
  );

  protected readonly consegnaCambiata = computed(() => {
    const valori = this.valori();
    const spesa = this.spesa();
    return (
      valori.indirizzoConsegna.trim() !== spesa.indirizzoConsegna ||
      valori.latitudine !== spesa.posizioneConsegna.latitudine ||
      valori.longitudine !== spesa.posizioneConsegna.longitudine
    );
  });

  protected readonly ciSonoModifiche = computed(() => this.nomeCambiato() || this.consegnaCambiata());

  protected readonly invio = signal(false);
  protected readonly errori = signal<string[]>([]);

  ngOnInit(): void {
    const spesa = this.spesa();
    this.form.setValue({
      nomeCliente: spesa.nomeCliente,
      indirizzoConsegna: spesa.indirizzoConsegna,
      latitudine: spesa.posizioneConsegna.latitudine,
      longitudine: spesa.posizioneConsegna.longitudine,
    });
    this.valori.set(this.form.getRawValue());
    this.form.valueChanges.subscribe(() => this.valori.set(this.form.getRawValue()));

    // blocca lo scorrimento della pagina sottostante
    this.document.body.classList.add('modale-aperta');
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('modale-aperta');
  }

  protected nonValido(campo: keyof typeof this.form.controls): boolean {
    const controllo = this.form.controls[campo];
    return controllo.invalid && controllo.touched;
  }

  /**
   * Indirizzo scelto (o annullato) nel campo con i suggerimenti: come nella creazione,
   * indirizzo e coordinate vengono valorizzati insieme e le coordinate non sono mostrate.
   */
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
    return nonValido && controlli.indirizzoConsegna.touched;
  }

  protected chiudi(): void {
    if (!this.invio()) {
      this.chiusa.emit();
    }
  }

  protected salva(): void {
    this.errori.set([]);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.ciSonoModifiche()) {
      return;
    }

    // Richiesta parziale: solo i campi cambiati; indirizzo e posizione sempre insieme
    const valori = this.form.getRawValue();
    const richiesta: ModificaSpesa = { versione: this.spesa().versione };
    if (this.nomeCambiato()) {
      richiesta.nomeCliente = valori.nomeCliente.trim();
    }
    if (this.consegnaCambiata()) {
      richiesta.indirizzoConsegna = valori.indirizzoConsegna.trim();
      richiesta.posizioneConsegna = {
        latitudine: Number(valori.latitudine),
        longitudine: Number(valori.longitudine),
      };
    }

    this.invio.set(true);
    this.spesaService.modifica(this.spesa().id, richiesta).subscribe({
      next: (aggiornata) => {
        this.invio.set(false);
        this.salvata.emit(aggiornata);
      },
      error: (errore: HttpErrorResponse) => {
        this.errori.set(messaggiErrore(errore));
        this.invio.set(false);
      },
    });
  }
}
