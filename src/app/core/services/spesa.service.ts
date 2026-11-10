import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { CreazioneSpesa, ModificaSpesa, Spesa } from '../models';

/**
 * Chiamate REST relative alle spese.
 */
@Injectable({ providedIn: 'root' })
export class SpesaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/spese`;

  /** UC3 - Lista di tutte le spese, dalla piu' recente. */
  lista(): Observable<Spesa[]> {
    return this.http.get<Spesa[]>(this.url);
  }

  /** UC1 - Creazione di una spesa: il backend restituisce la spesa salvata con i totali calcolati. */
  crea(richiesta: CreazioneSpesa): Observable<Spesa> {
    return this.http.post<Spesa>(this.url, richiesta);
  }

  /** UC2 - Modifica parziale di una spesa: restituisce la spesa aggiornata (con la nuova versione). */
  modifica(id: string, richiesta: ModificaSpesa): Observable<Spesa> {
    return this.http.patch<Spesa>(`${this.url}/${id}`, richiesta);
  }

  /**
   * Avanzamento della spesa allo stato successivo (deciso dal backend).
   * La versione evita avanzamenti doppi o basati su dati non aggiornati.
   */
  avanzaStato(id: string, versione: number): Observable<Spesa> {
    return this.http.patch<Spesa>(`${this.url}/${id}/avanza-stato`, { versione });
  }
}
