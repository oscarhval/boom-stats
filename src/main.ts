import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication }               from '@angular/platform-browser';
import { provideRouter }                      from '@angular/router';
import { AppComponent }                       from './app/app.component';
import { routes }                             from './app/app.routes';
import { HttpClientModule } from '@angular/common/http';

if (false) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule)
  ]
}).catch(err => console.error(err));
