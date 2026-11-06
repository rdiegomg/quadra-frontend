import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { I18nService, TranslatePipe } from './core/i18n';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslatePipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);

  readonly logoSrc = computed(() =>
    this.theme.isDark() ? 'assets/logo-dark.jpeg' : 'assets/logo-light.png',
  );

  constructor() {
    const router = inject(Router);
    const bgFor = (url: string): string => {
      const seg = url.split('?')[0].split('/')[1] ?? '';
      switch (seg) {
        case '':
          return 'landing';
        case 'login':
          return 'login';
        case 'register':
          return 'register';
        case 'guia':
          return 'guide';
        default:
          return 'app';
      }
    };
    document.body.dataset['bg'] = bgFor(router.url);
    router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => (document.body.dataset['bg'] = bgFor(e.urlAfterRedirects)));
  }
}
