
import {
  Component,
  HostListener,
  ElementRef,
  OnInit,
  Renderer2
} from '@angular/core';
import {
  Router,
  NavigationStart,
  RouterModule
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpotifyAuthService } from '../../services/spotify-auth.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  scrolled = false;
  menuOpen = false;
  user$!: Observable<any>;

  searchTerm = '';

  constructor(
    private spotifyAuth: SpotifyAuthService,
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.user$ = this.spotifyAuth.user$;

    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        this.menuOpen = false;
        this.clearHighlights();
      });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 0;
  }

  onLogin(): void {
    this.menuOpen = false;
    this.spotifyAuth.login();
  }

  onSettings(): void {
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

  onSearchKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.executeSearch();
    }
  }

  clearHighlights() {
  document.querySelectorAll('span.highlighted').forEach(span => {
    const parent = span.parentNode!;
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    parent.removeChild(span);
  });
}

  executeSearch() {
  const term = this.searchTerm.trim();
  if (!term) return;

  this.clearHighlights();

  const container = document.body as HTMLElement;
  if (!container) return;

  const regex = new RegExp(`(${term})`, 'gi');
  let firstMatch: HTMLElement | null = null;

  const traverse = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (regex.test(text)) {
        const span = this.renderer.createElement('span');
        this.renderer.addClass(span, 'highlighted');
        const parts = text.split(regex);
        parts.forEach(part => {
          const tn = this.renderer.createText(part);
          if (regex.test(part)) {
            this.renderer.appendChild(span, tn);
            if (!firstMatch) firstMatch = span;
            this.renderer.insertBefore(node.parentNode, span, node);
          } else {
            this.renderer.insertBefore(node.parentNode, tn, node);
          }
        });
        this.renderer.removeChild(node.parentNode, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if ((node as Element).classList.contains('search-input')) return;
      node.childNodes.forEach(child => traverse(child));
    }
  };

  traverse(container);

  setTimeout(() => {
    if (firstMatch) {
      (firstMatch as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, 0);
}
}