# challenge-esselunga-frontend
Progetto realizzato per un colloquio con Esselunga.

## Container Gestione Spese Online

Al candidato è richiesto lo sviluppo di un container in grado di implementare gli Use Case di seguito descritti:

1. **Servizio REST di creazione di una spesa:** Riceve l'entità spesa e la persiste.
2. **Servizio REST di modifica spesa:** È permessa la modifica solo di alcuni campi della spesa (es. correzione indirizzo di consegna prima che la spesa parta dal magazzino).
3. **Servizio REST per lista di spese:** Restituisce la lista delle spese con il loro stato, eventualmente dando la possibilità di filtrare e ordinare.
4. **Servizio REST:** A partire dalla lista delle spese pronte per la consegna, calcola il percorso "migliore" dal magazzino Esselunga agli indirizzi di consegna considerando il rientro in magazzino, dove "migliore" corrisponde a un qualsiasi algoritmo, anche fake o banalmente lineare con interpolazione tra i punti.


### Entità
#### Spesa
- Coordinate Lat/Long di consegna.
- Elenco di articoli.
- Altri attributi ritenuti opportuni dal candidato.

#### Entità Magazzino
- Nome parlante.
- Coordinate Lat/Long.

#### Eventuali altre entità

Lo sviluppo deve essere effettuato con un framework moderno cloud native (in ordine di preferenza: Quarkus, Spring Boot, altro a scelta del candidato ritenuto opportuno allo scopo) e deve produrre un container Docker.

Il tool di build automation preferito è Maven, con l'utilizzo di JUnit per i test.



## Scelte tecniche

- **Angular 22** (componenti standalone e signals).
- **Bootstrap 5.3** e **Bootstrap Icons** per i componenti grafici; il tema (sfondo bianco, testi e bottoni blu) è ottenuto sovrascrivendo le sole variabili CSS di Bootstrap.
- **Leaflet** con le mappe di **OpenStreetMap** e il servizio di instradamento **OSRM** (server dimostrativo pubblico) per la pagina dei percorsi: non richiedono account né chiavi API.
- L'indirizzo del backend (`http://localhost:8080`) è definito in un unico file di configurazione (`src/app/core/config.ts`).

## Pagine

| Pagina | Percorso | Use case |
|---|---|---|
| Lista delle spese (homepage) | `/` | UC3, con avanzamento di stato e accesso alla modifica |
| Nuova spesa | `/spese/nuova` | UC1 |
| Modifica spesa | finestra modale aperta dalla lista | UC2 |
| Percorsi di consegna | `/percorsi` | UC4 |

## Ipotesi e assunzioni

- **Lista delle spese (UC3)**: il backend restituisce l'intera lista; **filtri** (stato, nome del cliente) e **ordinamenti** (data e ora di creazione, magazzino, totale) sono applicati nel frontend. Gli ordinamenti sono sovrapponibili: l'ultima colonna scelta diventa il criterio principale e le precedenti restano come criteri secondari.
- **Creazione (UC1)**: il frontend invia solo i dati di consegna, il magazzino e, per ogni articolo, riferimento e quantità. Il totale mostrato durante la composizione è un'**anteprima** calcolata con i prezzi del catalogo; il totale salvato è quello calcolato dal backend. Latitudine e longitudine di consegna sono inserite manualmente.
- **Modifica (UC2)**: sono modificabili solo il nome del cliente e i dati di consegna, e solo negli stati `CREATA` e `IN_PREPARAZIONE`; al backend vengono inviati solo i campi cambiati, con indirizzo e posizione sempre insieme, e la versione letta.
- **Cambio di stato**: il bottone sulla lista fa avanzare la spesa allo stato successivo; il nuovo stato è deciso dal backend.
- **Percorsi di consegna (UC4)**: l'ordine delle tappe è calcolato dal backend; il frontend richiede a OSRM solo il tracciato stradale nello stesso ordine. Se OSRM non è raggiungibile, le tappe vengono collegate con linee dritte.

## Avvio

### Sviluppo

Con il backend avviato su `http://localhost:8080`:

```bash
npm install
npm start
```

L'applicazione è disponibile su `http://localhost:4200` (unica origine autorizzata dal backend per le chiamate dal browser).

### Docker

Il frontend è incluso nel `docker-compose.yml` del backend: viene compilato e servito da nginx su `http://localhost:4200`. Il container e `npm start` usano la stessa porta, quindi non vanno avviati contemporaneamente.
