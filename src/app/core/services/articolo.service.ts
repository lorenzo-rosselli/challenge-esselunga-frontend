import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { Articolo } from '../models';

/**
 * Chiamate REST relative al catalogo articoli.
 */
@Injectable({ providedIn: 'root' })
export class ArticoloService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/articoli`;

  lista(): Observable<Articolo[]> {
    return this.http.get<Articolo[]>(this.url);
  }
}
