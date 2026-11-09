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

export interface Articolo {
  id: string;
  nome: string;
  descrizione: string;
  prezzo: number;
}
