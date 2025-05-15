import type { Routes } from '@angular/router';

import { HomeComponent }            from './pages/home/home.component';
import { StatsComponent }           from './pages/stats/stats.component';
import { Stats2Component }          from './pages/stats2/stats2.component';
import { ProfileComponent }         from './pages/profile/profile.component';
import { RecommendationsComponent } from './pages/recommendations/recommendations.component';
import { SettingsComponent }        from './pages/settings/settings.component';
import { ConcertsComponent }        from './pages/concerts/concerts.component';
import { CallbackComponent }        from './pages/callback/callback.component';

export const routes: Routes = [
  { path: '',               component: HomeComponent,         pathMatch: 'full' },
  { path: 'callback',       component: CallbackComponent },

  { path: 'stats',          component: StatsComponent },
  { path: 'stats2',         component: Stats2Component },
  { path: 'profile',        component: ProfileComponent },
  { path: 'recommendations',component: RecommendationsComponent },
  { path: 'settings',       component: SettingsComponent },
  { path: 'concerts',       component: ConcertsComponent },
  { path: '**',             redirectTo: '' }
];
