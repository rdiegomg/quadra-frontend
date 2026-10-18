import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, MatButtonModule, MatIconModule],
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
    {
      icon: 'upload_file',
      title: 'Registra tus cuentas',
      text: 'Carga tus cuentas por cobrar y por pagar con NIT de contraparte, montos, plazos y documentos de respaldo.',
    },
    {
      icon: 'hub',
      title: 'Mapeamos la red',
      text: 'El motor arma el mapa de obligaciones y detecta círculos de deuda y cadenas compensables que nadie ve desde adentro.',
    },
    {
      icon: 'handshake',
      title: 'Recibes tu propuesta',
      text: 'Cada empresa ve solo su resultado: cuánta deuda se le cancela y cuánto deja de cobrar. Nadie ve el dato de nadie.',
    },
    {
      icon: 'savings',
      title: 'Pagas por resultado',
      text: 'La comisión es un porcentaje de la deuda efectivamente cancelada. Si no se compensa nada, no pagas nada.',
    },
  ];
}
