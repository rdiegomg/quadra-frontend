import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/api.service';
import { NetworkStatistics } from '../../core/models';

@Component({
  selector: 'app-network',
  imports: [MatCardModule],
  template: `
    <div class="page">
      <h1 class="page-title">Red empresarial</h1>
      <p class="page-subtitle">
        Mapa interactivo de la red de obligaciones — visualización en desarrollo
        (Fase 6, Cytoscape.js)
      </p>
      @if (stats(); as s) {
        <mat-card>
          <mat-card-content>
            <p>
              {{ s.companies_in_network }} empresas conectadas ·
              {{ s.open_connections }} conexiones abiertas ·
              {{ s.companies_in_cycles }} empresas participan en ciclos
            </p>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
})
export class NetworkComponent {
  private readonly api = inject(ApiService);
  readonly stats = signal<NetworkStatistics | null>(null);

  constructor() {
    this.api.getNetworkStatistics().subscribe((s) => this.stats.set(s));
  }
}
