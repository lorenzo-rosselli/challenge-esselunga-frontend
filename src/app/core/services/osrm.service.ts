import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Posizione } from '../models';

/** Risposta del servizio di instradamento OSRM (solo i campi usati). */
interface RispostaOsrm {
  code: string;
  routes: { geometry: { coordinates: [number, number][] } }[];
}

/**
 * Tracciato stradale tramite OSRM (server dimostrativo pubblico, basato su OpenStreetMap).
 * <p>
 * Le tappe vengono passate nell'ordine gia' calcolato dal backend (UC4): OSRM disegna solo
 * le strade da percorrere, non riordina le tappe.
 */
@Injectable({ providedIn: 'root' })
export class OsrmService {
  private readonly http = inject(HttpClient);
  private readonly url = 'https://router.project-osrm.org/route/v1/driving';

  /**
   * @param punti punti da collegare, nell'ordine di visita
   * @return punti del tracciato stradale come coppie [latitudine, longitudine]
   */
  tracciato(punti: Posizione[]): Observable<[number, number][]> {
    // OSRM richiede le coordinate nel formato longitudine,latitudine separate da ';'
    const coordinate = punti.map((punto) => `${punto.longitudine},${punto.latitudine}`).join(';');
    return this.http
      .get<RispostaOsrm>(`${this.url}/${coordinate}`, {
        params: { overview: 'full', geometries: 'geojson' },
      })
      .pipe(
        map((risposta) => {
          if (risposta.code !== 'Ok' || risposta.routes.length === 0) {
            throw new Error('Percorso stradale non disponibile');
          }
          return risposta.routes[0].geometry.coordinates.map(
            ([longitudine, latitudine]) => [latitudine, longitudine] as [number, number],
          );
        }),
      );
  }
}
