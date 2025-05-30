import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpotifyAuthService } from '../../services/spotify-auth.service';
import { StatsService, Stats } from '../../services/stats.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnInit {
  @ViewChild('bgvid', { static: true }) bgVideo!: ElementRef<HTMLVideoElement>;

  stats$!: Observable<Stats>;

  features = [
    {
      icon: 'assets/icons/chart.svg',
      title: 'Estadísticas detalladas',
      description: 'Minutos de escucha, artistas y álbumes más reproducidos y evolución en el tiempo.'
    },
    {
      icon: 'assets/icons/recommend.svg',
      title: 'Recomendaciones personalizadas',
      description: 'Descubre nueva música basada en tu historial y tus preferencias.'
    },
    {
      icon: 'assets/icons/concert.svg',
      title: 'Planificación de conciertos',
      description: 'Encuentra eventos que encajen con tus artistas top.'
    },
    {
      icon: 'assets/icons/multi-platform.svg',
      title: 'Multi-plataforma',
      description: 'Integra Spotify y, próximamente, YouTube para un análisis completo.'
    }
  ];

  constructor(
    private spotifyAuth: SpotifyAuthService,
    private statsService: StatsService
  ) {}

  ngOnInit(): void {
    this.stats$ = this.statsService.realtimeStats$();
  }

  ngAfterViewInit(): void {
    const video = this.bgVideo.nativeElement;
    video.muted = true;
    setTimeout(() => video.play().catch(() => {}), 0);
  }

  onLogin(): void {
    this.spotifyAuth.login();
  }
}
