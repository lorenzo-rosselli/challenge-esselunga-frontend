/**
 * Modelli dei dati scambiati con il backend (corrispondono ai DTO delle API REST).
 */

export type StatoSpesa = 'CREATA' | 'IN_PREPARAZIONE' | 'PRONTA' | 'IN_CONSEGNA' | 'CONSEGNATA';

export interface Posizione {
  latitudine: number;
  longitudine: number;
}

export interface ElementoSpesa {
  articoloId: string;
  nome: string;
  prezzo: number;
  quantita: number;
  prezzoTotale: number;
}

export interface Spesa {
  id: string;
  nomeCliente: string;
  indirizzoConsegna: string;
  posizioneConsegna: Posizione;
  magazzinoId: string;
  stato: StatoSpesa;
  dataCreazione: string;
  dataUltimaModifica: string;
  versione: number;
  totale: number;
  articoli: ElementoSpesa[];
}

export interface Magazzino {
  id: string;
  nome: string;
  posizione: Posizione;
}

/** Tappa del percorso di consegna (UC4). */
export interface TappaPercorso {
  ordine: number;
  spesaId: string;
  nomeCliente: string;
  indirizzoConsegna: string;
  posizione: Posizione;
  distanzaDallaPrecedenteKm: number;
}

/** Percorso di consegna di un magazzino (UC4): partenza, tappe ordinate e rientro. */
export interface Percorso {
  magazzino: Magazzino;
  tappe: TappaPercorso[];
  distanzaRientroKm: number;
  distanzaTotaleKm: number;
}

export interface Articolo {
  id: string;
  nome: string;
  descrizione: string;
  prezzo: number;
}

/** Elemento della richiesta di creazione: solo articolo e quantita' (il resto lo calcola il backend). */
export interface ElementoCreazioneSpesa {
  articoloId: string;
  quantita: number;
}

/** Corpo della richiesta POST /spese (UC1). */
export interface CreazioneSpesa {
  nomeCliente: string;
  indirizzoConsegna: string;
  posizioneConsegna: Posizione;
  magazzinoId: string;
  articoli: ElementoCreazioneSpesa[];
}

/**
 * Corpo della richiesta PATCH /spese/{id} (UC2): si inviano solo i campi da cambiare.
 * Indirizzo e posizione vanno sempre inviati insieme; la versione e' quella letta dal client.
 */
export interface ModificaSpesa {
  nomeCliente?: string;
  indirizzoConsegna?: string;
  posizioneConsegna?: Posizione;
  versione: number;
}

/** Corpo delle risposte di errore applicativo del backend (400, 404, 409). */
export interface ErroreApi {
  codice: number;
  errore: string;
  messaggio: string;
}

/** Corpo delle risposte 400 di validazione dei dati (Bean Validation). */
export interface ErroreValidazione {
  title: string;
  status: number;
  violations: { field: string; message: string }[];
}
