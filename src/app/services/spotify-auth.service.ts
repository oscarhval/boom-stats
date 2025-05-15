import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SpotifyAuthService {
  private clientId     = 'fa7643f9baec40748981309a6083b14b';
  private redirectUri  = 'http://localhost:4200/callback';
  private authEndpoint = 'https://accounts.spotify.com/authorize';
  private responseType = 'token';
  private userSubject  = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {
    const token = this.getAccessToken();
    if (token) {
      this.fetchUserProfile(token)
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

 
  login(redirectPath: string = '/'): void {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-library-read',
      'user-read-recently-played'   
    ].join(' ');

    const url =
      `${this.authEndpoint}` +
      `?client_id=${this.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&response_type=${this.responseType}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&show_dialog=true` +
      `&state=${encodeURIComponent(redirectPath)}`;

    localStorage.removeItem('spotifyAccessToken');
    this.userSubject.next(null);

    window.location.href = url;
  }

 
  handleAuthentication(): void {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace('#', '?'));
    const token = params.get('access_token');
    const state = params.get('state') || '/';

    if (!token) return;

    localStorage.setItem('spotifyAccessToken', token);
    this.userSubject.next(null);

    this.fetchUserProfile(token)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.router.navigate([decodeURIComponent(state)]);
      });
  }

  private fetchUserProfile(token: string) {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http
      .get('https://api.spotify.com/v1/me', { headers })
      .pipe(tap(profile => this.userSubject.next(profile)));
  }

  getAccessToken(): string | null {
    return localStorage.getItem('spotifyAccessToken');
  }

  logout(): void {
    localStorage.removeItem('spotifyAccessToken');
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }
}
