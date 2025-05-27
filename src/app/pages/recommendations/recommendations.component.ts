import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { SpotifyAuthService } from '../../services/spotify-auth.service';

interface GenreCard {
  name: string;
  image: string;
}

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.scss'],
})
export class RecommendationsComponent implements OnInit {
  loading = false;
  error = false;

  genres: GenreCard[] = [
    { name: 'pop',       image: 'assets/genres/1.png' },
    { name: 'rock',      image: 'assets/genres/2.png' },
    { name: 'hip-hop',   image: 'assets/genres/3.png' },
    { name: 'indie',     image: 'assets/genres/4.png' },
    { name: 'jazz',      image: 'assets/genres/5.png' },
    { name: 'reggaeton',    image: 'assets/genres/6.png' },
    { name: 'dance',     image: 'assets/genres/7.png' },
    { name: 'electronic',       image: 'assets/genres/8.png' },
    { name: 'acoustic',  image: 'assets/genres/9.png' },
    { name: 'classical', image: 'assets/genres/10.png' },
    { name: 'metal',     image: 'assets/genres/14.png' },
    { name: 'blues',     image: 'assets/genres/11.png' },
    { name: 'punk',      image: 'assets/genres/12.png' },
    { name: 'country',   image: 'assets/genres/13.png' },
  ];

  favoriteGenres: GenreCard[] = [];

  constructor(
    private http: HttpClient,
    private auth: SpotifyAuthService
  ) {}

  ngOnInit(): void {
    this.fetchUserGenres();

    document.body.classList.add('no-footer');
    const token = this.auth.getAccessToken();
    if (!token) {
      this.auth.login();
      return;
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.auth.getAccessToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private async fetchUserGenres() {
    this.loading = true;
    this.error = false;
    try {
      const res: any = await this.http
        .get('https://api.spotify.com/v1/me/top/artists?limit=50', {
          headers: this.getHeaders(),
        })
        .toPromise();
      const items: any[] = res.items || [];
      const genreMap: Record<string, { count: number; image: string }> = {};
      for (const artist of items) {
        const img = artist.images?.[0]?.url || '';
        for (const g of artist.genres || []) {
          if (!genreMap[g]) genreMap[g] = { count: 0, image: img };
          genreMap[g].count++;
        }
      }
      this.favoriteGenres = Object.entries(genreMap)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, data]) => ({ name, image: data.image }));
    } catch (e) {
      console.error('Error cargando tus géneros', e);
      this.error = true;
    } finally {
      this.loading = false;
    }
  }
}
