import { StatoSpesa } from '../core/models';

/** Etichetta leggibile e colore del badge per ogni stato della spesa. */
export const STATI_SPESA: Record<StatoSpesa, { etichetta: string; classe: string }> = {
  CREATA: { etichetta: 'Creata', classe: 'text-bg-secondary' },
  IN_PREPARAZIONE: { etichetta: 'In preparazione', classe: 'text-bg-info' },
  PRONTA: { etichetta: 'Pronta', classe: 'text-bg-primary' },
  IN_CONSEGNA: { etichetta: 'In consegna', classe: 'text-bg-warning' },
  CONSEGNATA: { etichetta: 'Consegnata', classe: 'text-bg-success' },
};
