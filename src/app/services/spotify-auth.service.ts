
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface MyStats {
  followers: number;
  savedTracks: number;
  savedAlbums: number;
  following: number;
  topTracksCount: number;
  topArtistsCount: number;
}

@Injectable({ providedIn: 'root' })
export class SpotifyAuthService {
  private clientId     = 'fa7643f9baec40748981309a6083b14b';
  private redirectUri  = 'http://127.0.0.1:4200/callback';
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
      'user-read-recently-played',
      'user-follow-read'
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
      .subscribe(() => this.router.navigate([decodeURIComponent(state)]));
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

  getMyStats(): Observable<MyStats> {
    const token = this.getAccessToken();
    if (!token) {
      return of({
        followers: 0,
        savedTracks: 0,
        savedAlbums: 0,
        following: 0,
        topTracksCount: 0,
        topArtistsCount: 0
      });
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return forkJoin({
      me: this.http.get<any>('https://api.spotify.com/v1/me', { headers }),
      savedTracks: this.http.get<any>(
        'https://api.spotify.com/v1/me/tracks?limit=1',
        { headers }
      ),
      savedAlbums: this.http.get<any>(
        'https://api.spotify.com/v1/me/albums?limit=1',
        { headers }
      ),
      following: this.http
        .get<any>(
          'https://api.spotify.com/v1/me/following?type=artist&limit=1',
          { headers }
        )
        .pipe(catchError(() => of({ artists: { total: 0 } }))),
      topTracks: this.http.get<any>(
        'https://api.spotify.com/v1/me/top/tracks?limit=1',
        { headers }
      ),
      topArtists: this.http.get<any>(
        'https://api.spotify.com/v1/me/top/artists?limit=1',
        { headers }
      )
    }).pipe(
      map(res => ({
        followers:       res.me.followers?.total      || 0,
        savedTracks:     res.savedTracks.total        || 0,
        savedAlbums:     res.savedAlbums.total        || 0,
        following:       res.following.artists?.total || 0,
        topTracksCount:  res.topTracks.total          || 0,
        topArtistsCount: res.topArtists.total         || 0
      }))
    );
  }
}
