import { HttpErrorResponse } from '@angular/common/http';
import { ErroreApi, ErroreValidazione } from '../core/models';

/**
 * Converte un errore HTTP del backend nell'elenco di messaggi da mostrare all'utente.
 */
export function messaggiErrore(errore: HttpErrorResponse): string[] {
  if (errore.status === 0) {
    return ['Impossibile contattare il backend: verificare che sia avviato.'];
  }
  const validazione = errore.error as ErroreValidazione | null;
  if (validazione?.violations?.length) {
    return validazione.violations.map((violazione) => violazione.message);
  }
  const applicativo = errore.error as ErroreApi | null;
  if (applicativo?.messaggio) {
    return [applicativo.messaggio];
  }
  return [`Errore imprevisto (${errore.status}).`];
}
