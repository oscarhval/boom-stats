import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConcertsService } from '../../../services/concert.service';
import { TransportService } from '../../../services/transport.service';
import { Concert } from '../../../models/concert.model';

@Component({
  selector: 'app-concert-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './concert-detail.component.html',
  styleUrls: ['./concert-detail.component.scss']
})
export class ConcertDetailComponent implements OnInit {
  concert?: Concert;
  loading = true;
  error = '';
  trustedMapHtml?: SafeHtml;
  transportOrigin: string = '';
  userLatLng: { lat: number; lng: number } | null = null;
  locationResolved: boolean = false;
  transportLinks: Array<{ label: string; url: string; icon: string; subtitle?: string }> = [];
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private concertsSvc: ConcertsService,
    private transportSvc: TransportService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/concerts']);
      return;
    }

    this.concertsSvc.getConcertById(id).subscribe({
      next: c => {
        this.concert = c;
        const query = encodeURIComponent(c.venue || c.location || '');
        const iframe = `<iframe src="https://maps.google.com/maps?q=${query}&output=embed" width="100%" height="250" style="border:0" allowfullscreen loading="lazy"></iframe>`;
        this.trustedMapHtml = this.sanitizer.bypassSecurityTrustHtml(iframe);
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar el concierto.';
        this.loading = false;
      }
    });
  }

  onPurchase(): void {
    if (this.concert?.ticketUrl) {
      window.open(this.concert.ticketUrl, '_blank');
    }
  }

  goBack(): void {
    this.router.navigate(['/concerts']);
  }

  isValidDate(d: Date): boolean {
    return d instanceof Date && !isNaN(d.getTime());
  }

  askUserLocation(): void {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización. Por favor, ingresa tu ciudad manualmente.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        this.userLatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        try {
          const city = await this.reverseGeocode(this.userLatLng.lat, this.userLatLng.lng);
          this.transportOrigin = city;
          this.locationResolved = true;
          await this.generateTransportOptions();
        } catch (err) {
          console.error('No se pudo obtener ciudad desde coordenadas:', err);
          this.locationResolved = false;
        }
      },
      err => {
        console.warn('Usuario denegó geolocalización o hubo error:', err);
        this.locationResolved = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const resp = await fetch(url);
    const data = await resp.json();
    return (
      data.address.city ||
      data.address.town ||
      data.address.village ||
      data.address.state ||
      ''
    );
  }

  async generateTransportOptions(): Promise<void> {
    if (!this.concert) return;

    const rawDest = this.concert.venue || this.concert.location || '';
    const destCity = this.transportSvc.extractCityFromAddress(rawDest);
    const fechaIdaForUrl = this.concert.date
      ? (this.concert.date instanceof Date
          ? this.formatDate(this.concert.date)
          : this.formatDate(new Date(this.concert.date)))
      : this.formatDate(new Date());

    let distanceKm: number | null = null;
    let drivingInfo: { durationText: string; distanceText: string } | undefined;

    if (
      this.userLatLng &&
      this.concert.latitude != null &&
      this.concert.longitude != null
    ) {
      try {
        distanceKm = 650;
        drivingInfo = { durationText: '6 h 30 min', distanceText: '650 km' };
      } catch {
        distanceKm = null;
      }
    }

    if (distanceKm === null) {
      const origenPais = this.transportOrigin.split(',').pop()?.trim().toLowerCase() || '';
      const destPaisLower = destCity.toLowerCase();
      distanceKm = (origenPais && destPaisLower && origenPais !== destPaisLower) ? 1200 : 100;
    }

    const carLinks = this.transportSvc.buildTransportLinks(
      this.transportOrigin,
      rawDest,
      new Date(fechaIdaForUrl),
      distanceKm,
      drivingInfo
    ).filter(link => {
      const lower = link.label.toLowerCase();
      return lower.includes('roadtrip') || lower.includes('coche') || lower.includes('car');
    });

    this.transportLinks = carLinks.map(link => {
      const finalLabel = `Ruta desde: ${this.transportOrigin} hasta ${rawDest}`;
      return {
        label: finalLabel,
        url: link.url,
        icon: link.icon,
        subtitle: ''
      };
    });
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatDisplayDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${day}-${m}-${y}`;
  }

  resetTransport(): void {
    this.locationResolved = false;
    this.transportOrigin = '';
    this.transportLinks = [];
  }
}
