import { Component, OnInit } from '@angular/core';
import { SpotifyAuthService } from '../../services/spotify-auth.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})
export class CallbackComponent implements OnInit {

  constructor(private spotifyAuthService: SpotifyAuthService) {}

  ngOnInit(): void {
    this.spotifyAuthService.handleAuthentication(); // Maneja la autenticación cuando se carga
  }
}
