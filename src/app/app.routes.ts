import type { Routes } from '@angular/router';

import { HomeComponent }            from './pages/home/home.component';
import { CallbackComponent }        from './pages/callback/callback.component';
import { StatsComponent }           from './pages/stats/stats.component';
import { Stats2Component }          from './pages/stats2/stats2.component';
import { RecommendationsComponent } from './pages/recommendations/recommendations.component';
import { GenreDetailsComponent }    from './pages/recommendations/genre-details/genre-details.component';
import { SettingsComponent }        from './pages/settings/settings.component';
import { ConcertsComponent }        from './pages/concerts/concerts.component';
import { ConcertDetailComponent }   from './pages/concerts/concert-detail/concert-detail.component';

export const routes: Routes = [
  { path: '',                       component: HomeComponent,         pathMatch: 'full' },
  { path: 'callback',               component: CallbackComponent },
  { path: 'stats',                  component: StatsComponent },
  { path: 'stats2',                 component: Stats2Component },
  { path: 'recommendations/:genre', component: GenreDetailsComponent },
  { path: 'recommendations',        component: RecommendationsComponent, pathMatch: 'full' },
  { path: 'settings',               component: SettingsComponent },
  { path: 'concerts',               component: ConcertsComponent },
  { path: 'concerts/:id',           component: ConcertDetailComponent },
  { path: '**',                     redirectTo: '' }
];