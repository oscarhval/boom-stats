import { Component, HostListener } from '@angular/core';
import { CommonModule }            from '@angular/common';
import { RouterModule }    from '@angular/router';
import { SpotifyAuthService }      from '../../services/spotify-auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  scrolled = false;
  menuOpen = false;
  user$;

  constructor(
    private spotifyAuth: SpotifyAuthService,
  ) {
    this.user$ = this.spotifyAuth.user$;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 0;
  }

  onLogin(): void {
    this.spotifyAuth.login();
  }

  onLogout(): void {
    this.spotifyAuth.logout();
  }
}
