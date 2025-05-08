import { Component, OnInit, OnDestroy } from '@angular/core';
import { SpotifyAuthService } from '../../services/spotify-auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent implements OnInit, OnDestroy {
  constructor(private spotifyAuthService: SpotifyAuthService) {}

  ngOnInit(): void {
    document.body.classList.add('no-footer');
    this.spotifyAuthService.handleAuthentication();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('no-footer');
  }
}
