import { Component, HostListener, ElementRef, OnInit } from '@angular/core';
import { Router, NavigationStart, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpotifyAuthService } from '../../services/spotify-auth.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  scrolled = false;
  menuOpen = false;
  user$!: Observable<any>;

  constructor(
    private spotifyAuth: SpotifyAuthService,
    private router: Router,
    private el: ElementRef
  ) {}

  ngOnInit() {
    // Inicializa el observable de usuario
    this.user$ = this.spotifyAuth.user$;

    // Cerrar menú justo al arrancar cualquier navegación
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        this.menuOpen = false;
      });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 0;
  }

  onToggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  onLogin(): void {
    this.menuOpen = false;
    this.spotifyAuth.login();
  }

  onSettings(): void {
    // Solo en caso de navegación programática
    this.menuOpen = false;
    this.router.navigate(['/settings']);
  }

  onLogout(): void {
    this.menuOpen = false;
    this.spotifyAuth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen && !this.el.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }
}
