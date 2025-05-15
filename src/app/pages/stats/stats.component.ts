import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Chart, LineController, BarController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend } from 'chart.js';
import { SpotifyAuthService } from '../../services/spotify-auth.service';

Chart.register( LineController, BarController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend
);

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit, OnDestroy {
  @ViewChild('genreChart')    genreCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('durationChart') durationCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('popularityChart') popularityCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('yearChart')      yearCanvas!: ElementRef<HTMLCanvasElement>;

  loading = true;
  error = false;

  user: any = null;
  followers = 0;
  savedTracksCount = 0;
  totalMinutes = 0;
  lastDayMinutes = 0;
  topTracks: any[] = [];
  topArtists: any[] = [];
  topAlbums: any[] = [];

  private genreChart?: Chart;
  private durationChart?: Chart;
  private popularityChart?: Chart;
  private yearChart?: Chart;
  private sub?: Subscription;

  constructor(
    private auth: SpotifyAuthService,
    private http: HttpClient,
    private zone: NgZone
  ) {}

  ngOnInit() {
    document.body.classList.add('no-footer');
    const token = this.auth.getAccessToken();
    if (!token) {
      this.auth.login();
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const since = Date.now() - 24 * 60 * 60 * 1000;

    this.sub = forkJoin({
      profile: this.http.get<any>('https://api.spotify.com/v1/me', { headers }),
      saved:   this.http.get<any>('https://api.spotify.com/v1/me/tracks?limit=50', { headers }),
      tracks:  this.http.get<any>('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50', { headers }),
      artists: this.http.get<any>('https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=50', { headers }),
      recent:  this.http.get<{ items: { track: { duration_ms: number } }[] }>(
                  `https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${since}`,
                  { headers }
               ).pipe(catchError(() => of({ items: [] })))
    }).pipe(
      catchError(() => { this.error = true; return of(null); }),
      finalize(() => { this.loading = false; })
    ).subscribe(res => {
      if (!res) return;

      this.user = res.profile;
      this.followers = res.profile.followers.total;
      this.savedTracksCount = res.saved.total;
      this.topTracks  = res.tracks.items.filter((t: any) => t.album?.images?.length);
      this.topArtists = res.artists.items.filter((a: any) => a.images?.length);

      const albumCounts: Record<string, { album: any, count: number }> = {};
      this.topTracks.forEach(t => {
        const a = t.album;
        if (!albumCounts[a.id]) albumCounts[a.id] = { album: a, count: 0 };
        albumCounts[a.id].count++;
      });
      this.topAlbums = Object.values(albumCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(item => item.album);

      this.totalMinutes = this.topTracks.reduce((sum, t) => sum + t.duration_ms, 0) / 60000;
      const recentMs = res.recent.items.reduce((sum, it) => sum + it.track.duration_ms, 0);
      this.lastDayMinutes = recentMs / 60000;

      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.buildGenreChart();
          this.buildDurationChart();
          this.buildPopularityChart();
          this.buildYearChart();
          document.body.classList.remove('no-footer');
        });
      });
    });
  }

  ngOnDestroy() {
    document.body.classList.remove('no-footer');
    this.sub?.unsubscribe();
  }

  private buildGenreChart() {
    const counts: Record<string, number> = {};
    this.topArtists.forEach(a =>
      (a.genres as string[]).forEach(g => counts[g] = (counts[g] || 0) + 1)
    );
    const labels = Object.keys(counts).slice(0, 5);
    const data = labels.map(l => counts[l]);
    const ctx = this.genreCanvas.nativeElement.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    grad.addColorStop(0, 'rgba(229,9,20,0.9)');
    grad.addColorStop(1, 'rgba(20,20,20,0.5)');
    this.genreChart?.destroy();
    this.genreChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Veces escuchado', data, tension: 0.4, fill: true, backgroundColor: grad, borderColor: 'rgba(229,9,20,1)', borderWidth: 3, pointRadius: 5, pointBackgroundColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 7, pointHoverBackgroundColor: '#fff', pointHoverBorderColor: 'rgba(229,9,20,1)' }] },
      options: {
        maintainAspectRatio: false, responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a', titleColor: '#fff', bodyColor: '#eee',
            padding: 10, cornerRadius: 6, displayColors: false,
            callbacks: {
              title: items => `Género: ${items[0].label}`,
              label: item => `Veces: ${item.parsed.y}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#ccc', font: { size: 12 } } },
          y: { beginAtZero: true, grace: '10%', grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#ccc', stepSize: 1 } }
        }
      }
    });
  }

  private buildDurationChart() {
    const buckets: Record<number, number> = {};
    this.topTracks.forEach(t => {
      const secs = t.duration_ms / 1000;
      const key = Math.floor(secs / 30) * 30;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const sorted = Object.keys(buckets).map(Number).sort((a, b) => a - b);
    const labels = sorted.map(s => `${(s / 60).toFixed(1)} min`);
    const data = sorted.map(s => buckets[s]);
    const ctx = this.durationCanvas.nativeElement.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    grad.addColorStop(0, 'rgba(229,9,20,0.9)');
    grad.addColorStop(1, 'rgba(20,20,20,0.5)');
    this.durationChart?.destroy();
    this.durationChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Número de pistas', data, tension: 0.35, fill: true, backgroundColor: grad, borderColor: 'rgba(229,9,20,1)', borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#fff', pointHoverBorderColor: 'rgba(229,9,20,1)' }] },
      options: {
        maintainAspectRatio: false, responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a', titleColor: '#fff', bodyColor: '#eee',
            padding: 10, cornerRadius: 6, displayColors: false,
            callbacks: {
              title: items => `Duración: ${items[0].label}`,
              label: item => `Pistas: ${item.parsed.y}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#ccc', maxRotation: 0, font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#ccc' } }
        }
      }
    });
  }

private buildPopularityChart() {
  const buckets: Record<string, number> = {
    '0-20':   0,
    '21-40':  0,
    '41-60':  0,
    '61-80':  0,
    '81-100': 0
  };

  this.topTracks.forEach(t => {
    const p = t.popularity;
    if (p <= 20)      buckets['0-20']++;
    else if (p <= 40) buckets['21-40']++;
    else if (p <= 60) buckets['41-60']++;
    else if (p <= 80) buckets['61-80']++;
    else              buckets['81-100']++;
  });

  const labels = ['81-100', '61-80', '41-60', '21-40', '0-20'];
  const data   = labels.map(l => buckets[l]);

  const ctx = this.popularityCanvas.nativeElement.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  grad.addColorStop(0, 'rgba(229,9,20,0.9)');
  grad.addColorStop(1, 'rgba(20,20,20,0.5)');

  this.popularityChart?.destroy();
  this.popularityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Número de pistas',
        data,
        backgroundColor: grad,
        borderColor: 'rgba(229,9,20,1)',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.5,
        maxBarThickness: 24
      }]
    },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleColor: '#fff',
          bodyColor: '#eee',
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            title: items => `Rango: ${items[0].label}`,
            label: item => `Pistas: ${item.parsed.x}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.08)' },
          ticks: { color: '#ccc', stepSize: 5 }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#ccc' }
        }
      }
    }
  });
}


  private buildYearChart() {
    const decades = ['80s','90s','2000s','2010s','2020s'];
    const buckets: Record<string, number> = { '80s':0,'90s':0,'2000s':0,'2010s':0,'2020s':0 };
    this.topTracks.forEach(t => {
      const yr = parseInt(t.album.release_date.slice(0,4),10);
      const dc = yr<1990 ? '1980s' : yr<2000 ? '1990s' : yr<2010 ? '2000s' : yr<2020 ? '2010s' : '2020s';
      buckets[dc]++;
    });
    const labels = decades;
    const data = decades.map(d => buckets[d]);
    const ctx = this.yearCanvas.nativeElement.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    grad.addColorStop(0, 'rgba(229,9,20,0.9)');
    grad.addColorStop(1, 'rgba(20,20,20,0.5)');
    this.yearChart?.destroy();
    this.yearChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Número de pistas', data, backgroundColor: grad, borderColor: 'rgba(229,9,20,1)', borderWidth: 1, borderRadius: 6, barPercentage: 0.5, maxBarThickness: 24 }] },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { } },
        scales: {
          x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#ccc', stepSize: 5 } },
          y: { grid: { display: false }, ticks: { color: '#ccc' } }
        }
      }
    });
  }
}
