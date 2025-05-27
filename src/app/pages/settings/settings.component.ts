import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { RouterModule }       from '@angular/router';
import { SpotifyAuthService } from '../../services/spotify-auth.service';
import { Observable }         from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  user$!: Observable<any>;

  displayName = '';
  photoUrl = '';
  private newPhotoFile?: File;

  darkMode = false;
  accentColor = 'red';
  fontSize: 'normal' | 'large' = 'normal';
  readonly accentOptions = [
    { value: 'red',   label: 'Rojo'  },
    { value: 'blue',  label: 'Azul'  },
    { value: 'green', label: 'Verde' }
  ];
  readonly fontSizeOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'large',  label: 'Grande' }
  ];

  selectedLanguage = 'es';
  selectedTimeFormat: '24' | '12' = '24';
  readonly languages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
  ];

  constructor(public auth: SpotifyAuthService) {}

  ngOnInit() {
    this.user$ = this.auth.user$;
    this.user$.subscribe(u => {
      this.displayName = localStorage.getItem('overrideName') || u.display_name;
      this.photoUrl    = localStorage.getItem('overridePhoto') || (u.images?.[0]?.url ?? '');
    });

    this.darkMode           = localStorage.getItem('darkMode') === 'true';
    this.accentColor        = localStorage.getItem('accentColor') || this.accentColor;
    this.fontSize           = (localStorage.getItem('fontSize') as any) || this.fontSize;
    this.selectedLanguage   = localStorage.getItem('language') || this.selectedLanguage;
    this.selectedTimeFormat = (localStorage.getItem('timeFormat') as any) || this.selectedTimeFormat;

    document.body.classList.toggle('dark-theme', this.darkMode);
    document.documentElement.style.setProperty('--accent', `var(--accent-${this.accentColor})`);
    document.documentElement.style.setProperty('font-size', this.fontSize === 'large' ? '1.125rem' : '1rem');
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    this.newPhotoFile = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.photoUrl = reader.result as string;
      localStorage.setItem('overridePhoto', this.photoUrl);
    };
    reader.readAsDataURL(this.newPhotoFile);
  }

  saveProfile() {
    localStorage.setItem('overrideName', this.displayName);
    alert('Perfil actualizado');
  }

  logout() {
    this.auth.logout();
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', String(this.darkMode));
    document.body.classList.toggle('dark-theme', this.darkMode);
  }

  saveAccentColor() {
    localStorage.setItem('accentColor', this.accentColor);
    document.documentElement.style.setProperty('--accent', `var(--accent-${this.accentColor})`);
  }

  saveFontSize() {
    localStorage.setItem('fontSize', this.fontSize);
    document.documentElement.style.setProperty('font-size', this.fontSize === 'large' ? '1.125rem' : '1rem');
  }

  saveLanguage() {
    localStorage.setItem('language', this.selectedLanguage);
    window.location.reload();
  }

  saveTimeFormat() {
    localStorage.setItem('timeFormat', this.selectedTimeFormat);
    alert('Formato de hora guardado');
  }

  downloadData() {
    window.open('/api/user/export', '_blank');
  }
}
