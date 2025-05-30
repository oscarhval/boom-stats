import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConcertsService } from '../../../services/concert.service';
import { Concert } from '../../../models/concert.model';

@Component({
  selector: 'app-concert-detail',
  standalone: true,
  imports: [ CommonModule, RouterModule ],
  templateUrl: './concert-detail.component.html',
  styleUrls: ['./concert-detail.component.scss']
})
export class ConcertDetailComponent implements OnInit {
  concert?: Concert;
  loading = true;
  error = '';
  trustedMapHtml?: SafeHtml;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private concertsSvc: ConcertsService,
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
        const query = encodeURIComponent(c.location || c.venue);
        const iframe =
          `<iframe
            src="https://maps.google.com/maps?q=${query}&output=embed"
            width="100%" height="250" style="border:0"
            allowfullscreen loading="lazy">
          </iframe>`;
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
}
