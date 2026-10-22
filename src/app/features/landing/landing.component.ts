import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TranslatePipe } from '../../core/i18n';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  readonly logoSrc = computed(() =>
    this.theme.isDark() ? 'assets/logo-dark.jpeg' : 'assets/logo-light.png',
  );

  readonly homeLink = computed(() =>
    this.auth.isAdmin() ? '/admin' : '/dashboard',
  );

  readonly steps = [
    { icon: 'upload_file', titleKey: 'landing.step1.t', textKey: 'landing.step1.x' },
    { icon: 'hub', titleKey: 'landing.step2.t', textKey: 'landing.step2.x' },
    { icon: 'handshake', titleKey: 'landing.step3.t', textKey: 'landing.step3.x' },
    { icon: 'savings', titleKey: 'landing.step4.t', textKey: 'landing.step4.x' },
  ];
}
