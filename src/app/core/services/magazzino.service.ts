import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { Magazzino, Percorso } from '../models';

/**
 * Chiamate REST relative ai magazzini.
 */
@Injectable({ providedIn: 'root' })
export class MagazzinoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/magazzini`;

  lista(): Observable<Magazzino[]> {
    return this.http.get<Magazzino[]>(this.url);
  }

  /** UC4 - Percorso di consegna delle spese pronte del magazzino, calcolato dal backend. */
  percorso(id: string): Observable<Percorso> {
    return this.http.get<Percorso>(`${this.url}/${id}/percorso`);
  }
}
