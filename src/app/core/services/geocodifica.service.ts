import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Posizione } from '../models';

/** Indirizzo suggerito durante la digitazione, con le sue coordinate. */
export interface SuggerimentoIndirizzo {
  /** Testo completo dell'indirizzo (es. "Via di Novoli 61, 50127 Firenze"). */
  indirizzo: string;
  /** Prima riga mostrata nel suggerimento (via e numero civico). */
  via: string;
  /** Seconda riga mostrata nel suggerimento (CAP, citta', provincia). */
  localita: string;
  posizione: Posizione;
}

/** Risposta del servizio Photon (GeoJSON, solo i campi usati). */
interface RispostaPhoton {
  features: {
    geometry: { coordinates: [number, number] };
    properties: {
      name?: string;
      street?: string;
      housenumber?: string;
      postcode?: string;
      city?: string;
      county?: string;
      countrycode?: string;
    };
  }[];
}

/**
 * Ricerca di indirizzi durante la digitazione tramite Photon (servizio pubblico basato su
 * OpenStreetMap, pensato per la ricerca "mentre si scrive"; non richiede account ne' chiavi).
 * I risultati sono limitati all'Italia e favoriscono l'area dei magazzini (Firenze).
 */
@Injectable({ providedIn: 'root' })
export class GeocodificaService {
  private readonly http = inject(HttpClient);
  private readonly url = 'https://photon.komoot.io/api/';

  cerca(testo: string): Observable<SuggerimentoIndirizzo[]> {
    return this.http
      .get<RispostaPhoton>(this.url, {
        params: {
          q: testo,
          limit: 8,
          lat: 43.8, // priorita' ai risultati vicini all'area dei magazzini
          lon: 11.15,
          bbox: '6.6,35.4,18.6,47.1', // Italia
        },
      })
      .pipe(map((risposta) => this.converti(risposta)));
  }

  private converti(risposta: RispostaPhoton): SuggerimentoIndirizzo[] {
    const suggerimenti: SuggerimentoIndirizzo[] = [];
    const giaPresenti = new Set<string>();

    for (const { geometry, properties: p } of risposta.features) {
      if (p.countrycode && p.countrycode !== 'IT') {
        continue;
      }
      const strada = p.street ?? p.name;
      const citta = p.city ?? p.county;
      if (!strada || !citta) {
        continue;
      }
      const via = p.housenumber ? `${strada} ${p.housenumber}` : strada;
      const localita = [p.postcode, citta].filter(Boolean).join(' ');
      const indirizzo = `${via}, ${localita}`;
      if (giaPresenti.has(indirizzo)) {
        continue;
      }
      giaPresenti.add(indirizzo);

      const [longitudine, latitudine] = geometry.coordinates; // GeoJSON: [longitudine, latitudine]
      suggerimenti.push({ indirizzo, via, localita, posizione: { latitudine, longitudine } });
    }
    return suggerimenti.slice(0, 6);
  }
}
