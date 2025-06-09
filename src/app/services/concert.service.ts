import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, from }   from 'rxjs';
import {
  map,
  switchMap,
  catchError,
  mergeMap,
  toArray,
  retryWhen,
  scan,
  delay
} from 'rxjs/operators';
import { Concert }     from '../models/concert.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConcertsService {
  private readonly base         = '/tm-api';
  private readonly DEFAULT_SIZE = 1;
  private readonly THROTTLE_MS  = 50;
  private readonly MAX_RETRIES  = 2;
  private readonly RETRY_DELAY  = 100;

  constructor(private http: HttpClient) {}

  private normalize(str: string): string {
    return str.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim();
  }

  private getAttractionId(artist: string): Observable<string|null> {
    const params = new HttpParams()
      .set('apikey', environment.ticketmasterApiKey)
      .set('keyword', this.normalize(artist));
    return this.http.get<{ _embedded?: { attractions: any[] } }>(
      `${this.base}/attractions.json`, { params }
    ).pipe(
      map(r => r._embedded?.attractions?.[0]?.id ?? null),
      catchError(() => of(null))
    );
  }

  private getEventsByAttractionId(id: string, size: number): Observable<Concert[]> {
    const params = new HttpParams()
      .set('apikey', environment.ticketmasterApiKey)
      .set('attractionId', id)
      .set('classificationName', 'music')
      .set('size', size.toString());
    return this.http.get<{ _embedded?: { events: any[] } }>(
      `${this.base}/events.json`, { params }
    ).pipe(
      map(r => (r._embedded?.events ?? []).map(this.mapToConcert)),
      catchError(() => of([]))
    );
  }

  private getEventsByKeyword(artist: string, size: number): Observable<Concert[]> {
    const params = new HttpParams()
      .set('apikey', environment.ticketmasterApiKey)
      .set('keyword', this.normalize(artist))
      .set('classificationName', 'music')
      .set('size', size.toString());
    return this.http.get<{ _embedded?: { events: any[] } }>(
      `${this.base}/events.json`, { params }
    ).pipe(
      map(r => (r._embedded?.events ?? []).map(this.mapToConcert)),
      catchError(() => of([]))
    );
  }

  private mapToConcert(e: any): Concert {
    const artistName = e._embedded?.attractions?.[0]?.name ?? e.name;
    return {
      id:          e.id,
      artist:      artistName,
      date:        new Date(e.dates.start.dateTime),
      venue:       e._embedded?.venues[0]?.name        ?? 'Desconocido',
      location:    e._embedded?.venues[0]?.address?.line1 ?? '',
      image:       e.images?.[0]?.url                  ?? '',
      ticketUrl:   e.url,
      priceRanges: e.priceRanges                      ?? []
    };
  }

  getConcertsByArtists(artists: string[], size = this.DEFAULT_SIZE): Observable<Concert[]> {
    return from(artists).pipe(
      mergeMap(
        name => of(name).pipe(
          delay(this.THROTTLE_MS),
          switchMap(n => this.fetchForArtist(n, size))
        ),
        5
      ),
      toArray(),
      map(arrays => arrays.flat()),
      map(all => all
        .filter((c, i, a) => a.findIndex(x => x.id === c.id) === i)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
      )
    );
  }

  private fetchForArtist(name: string, size: number): Observable<Concert[]> {
    return this.getAttractionId(name).pipe(
      switchMap(id => id
        ? this.getEventsByAttractionId(id, size).pipe(
            switchMap(list => list.length ? of(list) : this.getEventsByKeyword(name, size))
          )
        : this.getEventsByKeyword(name, size)
      ),
      retryWhen(errors => errors.pipe(
        scan((acc, err) => {
          if (acc >= this.MAX_RETRIES || err.status !== 429) throw err;
          return acc + 1;
        }, 0),
        delay(this.RETRY_DELAY)
      )),
      catchError(() => of([]))
    );
  }

  getGlobalConcerts(size: number): Observable<Concert[]> {
    const params = new HttpParams()
      .set('apikey', environment.ticketmasterApiKey)
      .set('classificationName', 'music')
      .set('size', size.toString());
    return this.http.get<{ _embedded?: { events: any[] } }>(
      `${this.base}/events.json`, { params }
    ).pipe(
      map(r => (r._embedded?.events ?? []).map(this.mapToConcert)),
      catchError(() => of([]))
    );
  }

  getConcertById(id: string): Observable<Concert> {
    const params = new HttpParams().set('apikey', environment.ticketmasterApiKey);
    return this.http.get<any>(`${this.base}/events/${id}.json`, { params }).pipe(
      map(e => this.mapToConcert(e)),
      catchError(() => of({
        id,
        artist: 'Desconocido',
        date: new Date(NaN),
        venue: '',
        location: '',
        image: '',
        ticketUrl: '',
        priceRanges: []
      }))
    );
  }
}
