import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { Magazzino, Percorso, Posizione } from '../../core/models';
import { MagazzinoService } from '../../core/services/magazzino.service';
import { OsrmService } from '../../core/services/osrm.service';

/** Centro e zoom iniziali della mappa (area Firenze - Prato - Pistoia), prima della scelta del magazzino. */
const CENTRO_INIZIALE: L.LatLngExpression = [43.82, 11.12];
const ZOOM_INIZIALE = 10;

/**
 * UC4 - Percorsi di consegna.
 * <p>
 * Selezionato un magazzino, il backend restituisce le tappe (spese PRONTE) nell'ordine calcolato.
 * La mappa (Leaflet + OpenStreetMap) mostra il magazzino, le tappe numerate e il percorso:
 * il tracciato stradale e' richiesto a OSRM nello stesso ordine; se OSRM non risponde,
 * le tappe vengono collegate con linee dritte.
 */
@Component({
  selector: 'app-percorsi-consegna',
  imports: [DecimalPipe],
  templateUrl: './percorsi-consegna.html',
  styleUrl: './percorsi-consegna.css',
})
export class PercorsiConsegna implements OnInit, AfterViewInit, OnDestroy {
  private readonly magazzinoService = inject(MagazzinoService);
  private readonly osrmService = inject(OsrmService);

  private readonly contenitoreMappa = viewChild.required<ElementRef<HTMLDivElement>>('mappa');
  private mappa?: L.Map;
  /** Livello con marcatori e tracciato del percorso corrente (svuotato a ogni nuova selezione). */
  private readonly livelloPercorso = L.layerGroup();

  protected readonly magazzini = signal<Magazzino[]>([]);
  protected readonly magazzinoSelezionato = signal('');
  protected readonly percorso = signal<Percorso | null>(null);
  protected readonly caricamento = signal(false);
  protected readonly errore = signal<string | null>(null);
  /** Il tracciato e' disegnato con linee dritte perche' OSRM non e' raggiungibile. */
  protected readonly tracciatoApprossimato = signal(false);

  ngOnInit(): void {
    this.magazzinoService.lista().subscribe({
      next: (magazzini) => this.magazzini.set(magazzini),
      error: () => this.errore.set('Impossibile caricare i magazzini: verificare che il backend sia avviato.'),
    });
  }

  ngAfterViewInit(): void {
    this.mappa = L.map(this.contenitoreMappa().nativeElement).setView(CENTRO_INIZIALE, ZOOM_INIZIALE);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.mappa);
    this.livelloPercorso.addTo(this.mappa);
  }

  ngOnDestroy(): void {
    this.mappa?.remove();
  }

  protected selezionaMagazzino(id: string): void {
    this.magazzinoSelezionato.set(id);
    this.percorso.set(null);
    this.errore.set(null);
    this.tracciatoApprossimato.set(false);
    this.livelloPercorso.clearLayers();
    if (!id) {
      return;
    }

    this.caricamento.set(true);
    this.magazzinoService.percorso(id).subscribe({
      next: (percorso) => {
        this.percorso.set(percorso);
        this.caricamento.set(false);
        this.disegna(percorso);
      },
      error: () => {
        this.errore.set('Impossibile calcolare il percorso: verificare che il backend sia avviato.');
        this.caricamento.set(false);
      },
    });
  }

  /** Disegna magazzino, tappe numerate e tracciato del percorso. */
  private disegna(percorso: Percorso): void {
    const magazzino = percorso.magazzino.posizione;
    L.marker(this.latLng(magazzino), { icon: this.iconaMagazzino(), zIndexOffset: 1000 })
      .bindPopup(`<strong>${this.testo(percorso.magazzino.nome)}</strong><br>Partenza e rientro`)
      .addTo(this.livelloPercorso);

    for (const tappa of percorso.tappe) {
      L.marker(this.latLng(tappa.posizione), { icon: this.iconaTappa(tappa.ordine) })
        .bindPopup(
          `<strong>Tappa ${tappa.ordine}</strong><br>` +
            `${this.testo(tappa.nomeCliente)}<br>${this.testo(tappa.indirizzoConsegna)}<br>` +
            `<small>Spesa ${this.testo(tappa.spesaId)}</small>`,
        )
        .addTo(this.livelloPercorso);
    }

    if (percorso.tappe.length === 0) {
      this.mappa?.setView(this.latLng(magazzino), 12);
      return;
    }

    // Giro completo: magazzino -> tappe nell'ordine del backend -> rientro al magazzino
    const punti: Posizione[] = [magazzino, ...percorso.tappe.map((tappa) => tappa.posizione), magazzino];
    this.mappa?.fitBounds(L.latLngBounds(punti.map((punto) => this.latLng(punto))), { padding: [40, 40] });

    this.osrmService.tracciato(punti).subscribe({
      next: (tracciato) => this.disegnaLinea(tracciato),
      error: () => {
        this.tracciatoApprossimato.set(true);
        this.disegnaLinea(punti.map((punto) => this.latLng(punto)));
      },
    });
  }

  private disegnaLinea(punti: L.LatLngExpression[]): void {
    L.polyline(punti, {
      color: '#0d47a1',
      weight: 5,
      opacity: 0.8,
      dashArray: this.tracciatoApprossimato() ? '8 8' : undefined,
    }).addTo(this.livelloPercorso);
  }

  private latLng(posizione: Posizione): L.LatLngTuple {
    return [posizione.latitudine, posizione.longitudine];
  }

  private iconaMagazzino(): L.DivIcon {
    return L.divIcon({
      className: 'marcatore marcatore-magazzino',
      html: '<i class="bi bi-shop"></i>',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
    });
  }

  private iconaTappa(ordine: number): L.DivIcon {
    return L.divIcon({
      className: 'marcatore marcatore-tappa',
      html: `<span>${ordine}</span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }

  /** Evita che nomi o indirizzi vengano interpretati come HTML nei popup. */
  private testo(valore: string): string {
    const elemento = document.createElement('span');
    elemento.textContent = valore;
    return elemento.innerHTML;
  }
}
