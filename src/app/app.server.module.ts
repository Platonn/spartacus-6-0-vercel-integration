import { Injectable, NgModule, inject } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { PlatformLocation } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { provideServer } from '@spartacus/setup/ssr';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

@Injectable()
export class LoggerHttpInterceptor implements HttpInterceptor {
  location = console.log(inject(PlatformLocation).href);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    console.log('HTTP request', req.url);
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          console.log('HTTP response', event.url);
        }
      }),
      catchError((error) => {
        console.error('HTTP error', error.url);
        throw error;
      })
    );
  }
}
@NgModule({
  imports: [AppModule, ServerModule],
  bootstrap: [AppComponent],
  providers: [
    ...provideServer({
      serverRequestOrigin: process.env['SERVER_REQUEST_ORIGIN'],
    }),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggerHttpInterceptor,
      multi: true,
    },
  ],
})
export class AppServerModule {}
