// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SpotifyAuthService } from './services/spotify-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, RouterOutlet]
})
export class AppComponent {
  constructor(private spotifyAuthService: SpotifyAuthService) {}
  title = 'boom-stats';
  // Llama al servicio para iniciar el proceso de autenticación
  login() {
    this.spotifyAuthService.login();
  }

}
