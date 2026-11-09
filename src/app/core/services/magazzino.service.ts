import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { Magazzino } from '../models';

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
}
