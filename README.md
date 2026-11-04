# challenge-esselunga-backend
Progetto realizzato per un colloquio con Esselunga.
Al candidato è richiesto lo sviluppo della parte backend e frontend.


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
