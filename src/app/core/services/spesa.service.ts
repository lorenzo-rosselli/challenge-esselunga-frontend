import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { Spesa } from '../models';

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
}
