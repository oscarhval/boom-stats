import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { of, forkJoin, Observable } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { SpotifyAuthService } from '../../../services/spotify-auth.service';
import { CommonModule } from '@angular/common';

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  popularity: number;
}

interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: { images: { url: string }[] };
  popularity: number;
}

@Component({
  selector: 'app-genre-details',
  templateUrl: './genre-details.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./genre-details.component.scss']
})
export class GenreDetailsComponent implements OnInit {
  genre = '';
  description = '';
  relatedTags: string[] = [];
  artists: Artist[] = [];
  tracks: Track[] = [];
  loading = true;
  error = false;

  private allGenres = [
    'pop','rock','hip-hop','indie','jazz','dance',
    'reggaeton','classical','latin','electronic','country',
    'blues','metal','folk'
  ];

  private descriptionsByGenre: Record<string,string> = {
    pop:       'La música pop combina melodías pegajosas, ritmos dinámicos y arreglos pulidos para ofrecer canciones accesibles que marcan tendencias y se difunden rápidamente.',
    rock:      'El rock se caracteriza por guitarras potentes, baterías contundentes y letras cargadas de actitud, fusionando influencias clásicas y modernas para crear himnos inolvidables.',
    'hip-hop': 'El hip-hop fusiona versos rítmicos y flows singulares sobre bases contundentes, reflejando la cultura urbana con mensajes de empoderamiento y protesta.',
    indie:     'El indie apuesta por producciones alternativas e íntimas, con letras introspectivas y un espíritu creativo que escapa de lo comercial.',
    jazz:      'El jazz es un lenguaje musical sofisticado basado en improvisación y armonías complejas, donde cada interpretación revela el virtuosismo de sus intérpretes.',
    dance:     'La música dance ofrece grooves electrónicos energéticos y sintetizadores vibrantes diseñados para la pista de baile y la celebración nocturna.',
    reggaeton: 'El reguetón fusiona ritmos urbanos con influencias de dancehall y hip-hop, caracterizado por su dembow pegajoso y letras directas.',
    classical: 'La música clásica abarca composiciones maestras desde el barroco hasta el romántico, destacando por su riqueza armónica y profundidad emotiva.',
    latin:     'La música latina une salsa, bachata, reguetón y cumbia con percusiones cálidas y estribillos contagiosos que invitan al baile.',
    electronic:'La música electrónica explora texturas futuristas y beats contundentes, redefiniendo los límites de la producción sonora.',
    country:   'El country narra historias cercanas al corazón con guitarras acústicas y vocales sinceras, reflejando la vida rural y las raíces familiares.',
    blues:     'El blues nació del lamento y la pasión, con riffs sincopados y letras profundas que influyeron en el rock y el soul.',
    metal:     'El metal destaca por guitarras distorsionadas, baterías vertiginosas y vocales potentes en atmósferas épicas y oscuras.',
    folk:      'El folk rescata tradiciones populares con arreglos acústicos sencillos, creando un puente entre historia cultural y emoción íntima.'
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: SpotifyAuthService
  ) {}

  ngOnInit(): void {
    document.body.classList.add('no-footer');
    const token = this.auth.getAccessToken();
    if (!token) {
      this.auth.login();
      return;
    }
    this.route.paramMap.pipe(
      map((params: ParamMap) => params.get('genre') || ''),
      tap(g => this.genre = g),
      tap(() => this.loadAll())
    ).subscribe();
  }

  private loadAll(): void {
    this.loading = true;
    this.error = false;
    this.description = this.descriptionsByGenre[this.genre] || 'Explora este género musical en Spotify.';

    forkJoin({
      seeds: this.fetchGenreSeeds(),
      artists: this.fetchTopArtists()
    }).pipe(
      tap(({ seeds, artists }) => {
        this.artists = artists;
        let tags = seeds
          .filter(g => g !== this.genre && this.allGenres.includes(g))
          .slice(0, 3);
        if (tags.length < 3) {
          const extras = this.allGenres
            .filter(g => g !== this.genre && !tags.includes(g))
            .slice(0, 3 - tags.length);
          tags = [...tags, ...extras];
        }
        this.relatedTags = tags;
      }),
      switchMap(() => this.fetchTracks())
    ).subscribe(
      tracks => { this.tracks = tracks; this.loading = false; },
      () => { this.error = true; this.loading = false; }
    );
  }

  private fetchTracks(): Observable<Track[]> {
    const params = new HttpParams()
      .set('type', 'track')
      .set('q', `genre:"${this.genre}"`)
      .set('limit', '50');

    return this.http.get<{ tracks: { items: Track[] } }>(
      'https://api.spotify.com/v1/search',
      { headers: this.authHeaders(), params }
    ).pipe(
      map(res =>
        (res.tracks.items || [])
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 10)
      ),
      catchError(() => of<Track[]>([]))
    );
  }

  private fetchTopArtists(): Observable<Artist[]> {
    const params = new HttpParams()
      .set('type', 'artist')
      .set('q', `genre:"${this.genre}"`)
      .set('limit', '50');

    return this.http.get<{ artists: { items: Artist[] } }>(
      'https://api.spotify.com/v1/search',
      { headers: this.authHeaders(), params }
    ).pipe(
      map(r =>
        (r.artists.items || [])
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 10)
      ),
      catchError(() => of<Artist[]>([]))
    );
  }

  private fetchGenreSeeds(): Observable<string[]> {
    return this.http.get<{ genres: string[] }>(
      'https://api.spotify.com/v1/recommendations/available-genre-seeds',
      { headers: this.authHeaders() }
    ).pipe(
      map(r => r.genres),
      catchError(() => of<string[]>([]))
    );
  }

  getArtistNames(track: Track): string {
    return track.artists.map(a => a.name).join(', ');
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken();
    if (!token) throw new Error('No hay token de Spotify. Inicia sesión primero.');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
