import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyAuthService } from '../../services/spotify-auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('bgvid', { static: true }) bgVideo!: ElementRef<HTMLVideoElement>;

  constructor(private spotifyAuth: SpotifyAuthService) {}

  ngAfterViewInit(): void {
    const video = this.bgVideo.nativeElement;
    video.muted = true;
    setTimeout(() => {
      video.play().catch(err => {
        console.warn('No se pudo reproducir el vídeo automáticamente:', err);
      });
    }, 0);
  }

  onLogin(): void {
    this.spotifyAuth.login();
  }
}
