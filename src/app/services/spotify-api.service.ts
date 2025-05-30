
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SpotifyAuthService } from './spotify-auth.service';


export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
  externalUrl: string;
}

@Injectable({ providedIn: 'root' })
export class SpotifyApiService {
  constructor(
    private http: HttpClient,
    private auth: SpotifyAuthService
  ) {}


getTopArtists(limit: number): Observable<SpotifyArtist[]> {
  const token = this.auth.getAccessToken();
  if (!token) {
    return of([]);
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http
    .get<{ items: any[] }>(`/spotify/me/top/artists?limit=${limit}`, {
      headers
    })
    .pipe(
      map(response =>
        (response.items || []).map(item => ({
          id:        item.id,
          name:      item.name,
          genres:    item.genres || [],
          popularity:item.popularity,
          followers: { total: item.followers?.total || 0 },
          images:    (item.images || []).map((img: any) => ({
                       url:    img.url,
                       height: img.height,
                       width:  img.width
                     })),
          externalUrl: item.external_urls?.spotify || ''
        }))
      ),
      catchError(() => of([]))
    );
}
}