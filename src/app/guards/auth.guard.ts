import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router
} from '@angular/router';
import { of } from 'rxjs';
import { SpotifyAuthService } from '../services/spotify-auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: SpotifyAuthService,
    private router: Router
  ) {}

  canActivate() {
    const token = this.auth.getAccessToken();
    if (token) {
      return of(true);
    }
    this.router.navigate(['/']);
    return of(false);
  }
}
