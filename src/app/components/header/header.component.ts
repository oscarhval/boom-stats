import { Component } from '@angular/core';
import { SpotifyAuthService } from '../../services/spotify-auth.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  title = 'Boom Stats';

  constructor(private spotifyAuthService: SpotifyAuthService) {}

  login() {
    this.spotifyAuthService.login();
  }
}
