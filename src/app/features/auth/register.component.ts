import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService, TranslatePipe } from '../../core/i18n';
import { Sector } from '../../core/models';
import { ThemeService } from '../../core/theme.service';

const LEGAL_TYPES = ['SRL', 'SA', 'SCA', 'OTRO'];

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);

  readonly legalTypes = LEGAL_TYPES;
  readonly sectors = signal<Sector[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly logoSrc = computed(() =>
    this.theme.isDark() ? 'assets/logo-dark.jpeg' : 'assets/logo-light.png',
  );

  readonly form = this.fb.nonNullable.group({
    company_name: ['', [Validators.required, Validators.minLength(2)]],
    nit: ['', [Validators.required, Validators.minLength(4)]],
    legal_type: ['SRL', Validators.required],
    sector_id: [0, [Validators.required, Validators.min(1)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.api.getSectors().subscribe((s) => this.sectors.set(s));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.detail ?? this.i18n.t('reg.error'));
      },
    });
  }
}
