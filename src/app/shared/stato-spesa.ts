import { StatoSpesa } from '../core/models';

interface InfoStato {
  /** Etichetta leggibile dello stato. */
  etichetta: string;
  /** Colore del badge (classi Bootstrap). */
  classe: string;
  /** Stato successivo nel flusso; null per lo stato finale. */
  successivo: StatoSpesa | null;
  /** Nello stato la spesa e' modificabile (UC2: prima che parta dal magazzino). */
  modificabile: boolean;
}

/**
 * Informazioni sugli stati della spesa, coerenti con le regole del backend:
 * CREATA -> IN_PREPARAZIONE -> PRONTA -> IN_CONSEGNA -> CONSEGNATA.
 */
export const STATI_SPESA: Record<StatoSpesa, InfoStato> = {
  CREATA: { etichetta: 'Creata', classe: 'text-bg-secondary', successivo: 'IN_PREPARAZIONE', modificabile: true },
  IN_PREPARAZIONE: { etichetta: 'In preparazione', classe: 'text-bg-info', successivo: 'PRONTA', modificabile: true },
  PRONTA: { etichetta: 'Pronta', classe: 'text-bg-primary', successivo: 'IN_CONSEGNA', modificabile: false },
  IN_CONSEGNA: { etichetta: 'In consegna', classe: 'text-bg-warning', successivo: 'CONSEGNATA', modificabile: false },
  CONSEGNATA: { etichetta: 'Consegnata', classe: 'text-bg-success', successivo: null, modificabile: false },
};
