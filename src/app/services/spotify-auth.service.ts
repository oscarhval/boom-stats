import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

declare const window: any;

@Injectable({
  providedIn: 'root'
})
export class SpotifyAuthService {
  private clientId = 'fa7643f9baec40748981309a6083b14b'; 
  private redirectUri = 'http://localhost:4200/callback'; 
  private authEndpoint = 'https://accounts.spotify.com/authorize';
  private responseType = 'token'; 

  constructor(private router: Router) {}

  // Inicia el proceso de login y redirige a la página de autenticación de Spotify
  login() {
    const authUrl = `${this.authEndpoint}?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=${this.responseType}&scope=user-library-read playlist-read-private`;

    // Redirige al usuario a la página de autenticación de Spotify
    window.location.href = authUrl;
  }

  handleAuthentication() {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const accessToken = params.get('access_token');
      if (accessToken) {
        localStorage.setItem('spotifyAccessToken', accessToken);
        this.router.navigate(['/']);
      }
    }
  }

  getAccessToken() {
    return localStorage.getItem('spotifyAccessToken');

  }
}



