import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Intestazione dell'applicazione con il nome del progetto.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}
