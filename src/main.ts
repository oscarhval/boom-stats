import { enableProdMode }      from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter }        from '@angular/router';

import { AppComponent } from './app/app.component';
import { routes }       from './app/app.routes';

if (false) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
