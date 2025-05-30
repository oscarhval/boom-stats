
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { timer, forkJoin, Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

export interface Stats {
  tracks: number;
  albums: number;
  artists: number;
  topTracksCount: number;
  topArtistsCount: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly BASE = '/spotify';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('spotifyAccessToken') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  realtimeStats$(): Observable<Stats> {
    const h = this.headers();

    const tracks$ = this.http
      .get<{ total: number }>(`${this.BASE}/me/tracks?limit=1`, { headers: h })
      .pipe(catchError(() => of({ total: 0 })));

    const albums$ = this.http
      .get<{ total: number }>(`${this.BASE}/me/albums?limit=1`, { headers: h })
      .pipe(catchError(() => of({ total: 0 })));

    const following$ = this.http
      .get<{ artists: { total: number } }>(
        `${this.BASE}/me/following?type=artist&limit=1`,
        { headers: h }
      )
      .pipe(catchError(() => of({ artists: { total: 0 } })));

    const topTracks$ = this.http
      .get<{ total: number }>(`${this.BASE}/me/top/tracks?limit=1`, { headers: h })
      .pipe(catchError(() => of({ total: 0 })));

    const topArtists$ = this.http
      .get<{ total: number }>(`${this.BASE}/me/top/artists?limit=1`, { headers: h })
      .pipe(catchError(() => of({ total: 0 })));

    return timer(0, 30000).pipe(
      switchMap(() =>
        forkJoin({
          tracks: tracks$,
          albums: albums$,
          artists: following$,
          topTracks: topTracks$,
          topArtists: topArtists$
        })
      ),
      map(({ tracks, albums, artists, topTracks, topArtists }) => ({
        tracks:           tracks.total,
        albums:           albums.total,
        artists:          artists.artists.total,
        topTracksCount:   topTracks.total,
        topArtistsCount:  topArtists.total
      }))
    );
  }
}
