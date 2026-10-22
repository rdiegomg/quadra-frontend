import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService, TranslatePipe } from '../../core/i18n';
import { ThemeService } from '../../core/theme.service';
import { computed } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly logoSrc = computed(() =>
    this.theme.isDark() ? 'assets/logo-dark.jpeg' : 'assets/logo-light.png',
  );

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password.trim()).subscribe({
      next: () =>
        this.auth.loadCurrentUser().subscribe({
          next: () => this.auth.redirectAfterLogin(),
          error: () => {
            this.loading.set(false);
            this.error.set(this.i18n.t('login.err.profile'));
          },
        }),
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t('login.err.creds'));
      },
    });
  }
}
