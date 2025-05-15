import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SpotifyAuthService } from '../../services/spotify-auth.service';

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';
export type Category  = 'tracks' | 'artists' | 'albums';

@Component({
  selector: 'app-stats2',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stats2.component.html',
  styleUrls: ['./stats2.component.scss']
})
export class Stats2Component implements OnInit, OnDestroy {
  categories = [
    { label: 'Canciones', value: 'tracks' },
    { label: 'Artistas',  value: 'artists' },
    { label: 'Álbumes',   value: 'albums' }
  ] as { label: string; value: Category }[];

  timeRanges = [
    { label: '1 mes',    value: 'short_term' },
    { label: '6 meses',  value: 'medium_term' },
    { label: '12 meses', value: 'long_term' }
  ] as { label: string; value: TimeRange }[];

  selectedCategory: Category = 'tracks';
  selectedRange:    TimeRange = 'short_term';

  items: any[] = [];
  columns = 10;
  loading = false;
  error = false;
  hoverIndex: number | null = null;

  private sub?: Subscription;

  constructor(
    private http: HttpClient,
    private auth: SpotifyAuthService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadData();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('no-footer');
    this.sub?.unsubscribe();
  }

  onCategoryChange(cat: Category): void {
    this.selectedCategory = cat;
    this.loading = true;
    this.loadData();
  }

  onRangeChange(range: TimeRange): void {
    this.selectedRange = range;
    this.loading = true;
    this.loadData();
  }

  private loadData(): void {
    const token = this.auth.getAccessToken();
    if (!token) {
      this.auth.login();
      return;
    }

    this.error = false;
    this.items = [];
    document.body.classList.add('no-footer');

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    let request$;

    if (this.selectedCategory === 'albums') {
      const url = `https://api.spotify.com/v1/me/top/tracks?time_range=${this.selectedRange}&limit=50`;
      request$ = forkJoin({
        first:  this.http.get<any>(`${url}&offset=0`,  { headers }),
        second: this.http.get<any>(`${url}&offset=50`, { headers })
      });
    } else {
      const url = `https://api.spotify.com/v1/me/top/${this.selectedCategory}?time_range=${this.selectedRange}&limit=50`;
      request$ = forkJoin({
        first:  this.http.get<any>(`${url}&offset=0`,  { headers }),
        second: this.http.get<any>(`${url}&offset=50`, { headers })
      });
    }

    this.sub = request$.pipe(
      catchError(() => {
        this.error = true;
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        if (!this.error) {
          document.body.classList.remove('no-footer');
        }
      })
    ).subscribe(res => {
      if (!res || !res.first?.items || !res.second?.items) {
        this.error = true;
        this.padGrid();
        return;
      }

      if (this.selectedCategory === 'albums') {
        const all = [...res.first.items, ...res.second.items];
        const map: Record<string, { album: any; count: number }> = {};
        all.forEach(track => {
          const alb = track.album;
          if (!map[alb.id]) map[alb.id] = { album: alb, count: 0 };
          map[alb.id].count++;
        });
        this.items = Object.values(map)
          .sort((a, b) => b.count - a.count)
          .map(e => e.album);
      } else {
        this.items = [...res.first.items, ...res.second.items];
      }
      this.padGrid();
    });
  }

  private padGrid(): void {
    const total = 100;
    const len = this.items.length;
    const rem = (10 - (len % 10)) % 10;
    const afterFirst = len + rem;
    const maxExtraRows = 2;
    const possibleExtraRows = Math.floor((total - afterFirst) / 10);
    const extraRows = Math.min(maxExtraRows, possibleExtraRows);
    const placeholders = rem + extraRows * 10;
    for (let i = 0; i < placeholders; i++) {
      this.items.push({ placeholder: true });
    }
  }

  getImageUrl(item: any): string {
    if (item.placeholder) return '';
    if (this.selectedCategory === 'albums') {
      return item.images?.[0]?.url || '';
    }
    return item.images?.[0]?.url || item.album?.images?.[0]?.url || '';
  }

  getHoverInfo(item: any): string {
    if (this.selectedCategory === 'tracks') {
      return `Popularidad: ${item.popularity}`;
    }
    if (this.selectedCategory === 'artists') {
      return `Seguidores: ${item.followers?.total ?? '—'}`;
    }
    return `Lanzado: ${item.release_date} · Pistas: ${item.total_tracks}`;
  }
}
