
import { Component, OnInit } from '@angular/core';
import { forkJoin, from, of } from 'rxjs';
import {
  switchMap,
  mergeMap,
  filter,
  map,
  toArray,
  catchError
} from 'rxjs/operators';
import { SpotifyApiService } from '../../services/spotify-api.service';
import { ConcertsService }   from '../../services/concert.service';
import { Concert }           from '../../models/concert.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-concerts',
  templateUrl: './concerts.component.html',
  imports: [CommonModule,RouterModule],
  styleUrls: ['./concerts.component.scss']
})
export class ConcertsComponent implements OnInit {
  personalized: Concert[] = [];
  global:        Concert[] = [];
  loadingPersonal = false;
  loadingGlobal   = false;
  errorPersonal   = '';
  errorGlobal     = '';

  private readonly ARTIST_LIMIT      = 50;
  private readonly PERSONAL_COUNT    = 6;
  private readonly GLOBAL_FETCH_SIZE = 80;
  private readonly GLOBAL_COUNT      = 9;

  constructor(
    private spotifyApi: SpotifyApiService,
    private concertsSvc: ConcertsService
  ) {}

  ngOnInit() {
        document.body.classList.add('no-footer');
    this.loadingPersonal = true;
    this.loadingGlobal   = true;
    this.errorPersonal   = '';
    this.errorGlobal     = '';

    forkJoin({
      personal: this.loadPersonalized(),
      global:   this.loadGlobal()
    }).subscribe(
      ({ personal, global }) => {
        this.personalized    = personal;
        this.global          = global;
        this.loadingPersonal = false;
        this.loadingGlobal   = false;
        if (personal.length < this.PERSONAL_COUNT) {
          this.errorPersonal = `Solo se encontraron ${personal.length} conciertos personalizados.`;
        }
        if (global.length < this.GLOBAL_COUNT) {
          this.errorGlobal = `Solo se encontraron ${global.length} conciertos globales.`;
        }
      },
      () => {
        this.loadingPersonal = false;
        this.loadingGlobal   = false;
        this.errorPersonal   = 'Error al cargar conciertos personalizados.';
        this.errorGlobal     = 'Error al cargar conciertos globales.';
      }
    );
  }

  private loadPersonalized() {
    return this.spotifyApi.getTopArtists(this.ARTIST_LIMIT).pipe(
      switchMap(artists =>
        from(artists).pipe(
          mergeMap(
            artist =>
              this.concertsSvc.getConcertsByArtists([artist.name], 1).pipe(
                map(cs => cs[0] || null),
                catchError(() => of(null))
              ),
            1
          ),
          filter((c): c is Concert => c !== null),
          toArray(),
          map(events => {
            const normalize = (s: string) =>
              s.normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '')
               .toLowerCase()
               .trim();
            const result: Concert[] = [];
            const seen = new Set<string>();
            for (const e of events) {
              const key = normalize(e.artist);
              if (
                key !== 'nacao zumbi' &&
                !seen.has(key) &&
                result.length < this.PERSONAL_COUNT
              ) {
                seen.add(key);
                result.push(e);
              }
              if (result.length === this.PERSONAL_COUNT) break;
            }
            return result;
          })
        )
      )
    );
  }

  private loadGlobal() {
    return this.concertsSvc.getGlobalConcerts(this.GLOBAL_FETCH_SIZE).pipe(
      map((events: Concert[]) => {
        const normalize = (s: string) =>
          s.normalize('NFD')
           .replace(/[\u0300-\u036f]/g, '')
           .toLowerCase()
           .trim();
        const shuffled = [...events].sort(() => Math.random() - 0.5);
        const result: Concert[] = [];
        const seen = new Set<string>();
        for (const e of shuffled) {
          const key = normalize(e.artist);
          if (!seen.has(key)) {
            seen.add(key);
            result.push(e);
            if (result.length === this.GLOBAL_COUNT) break;
          }
        }
        return result;
      }),
      catchError(() => of([] as Concert[]))
    );
  }

  isValidDate(d: any): d is Date {
    return d instanceof Date && !isNaN(d.getTime());
  }
}
