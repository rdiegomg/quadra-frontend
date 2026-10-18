import { DatePipe, DecimalPipe, KeyValuePipe, PercentPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import {
  Chain,
  Company,
  Cycle,
  NetworkStatistics,
  Obligation,
  ObligationStatus,
  SimulationResult,
} from '../../core/models';

const STATUS_LABELS: Record<ObligationStatus, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
};

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    DatePipe,
    DecimalPipe,
    KeyValuePipe,
    PercentPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent {
  private readonly api = inject(ApiService);

  readonly stats = signal<NetworkStatistics | null>(null);
  readonly companies = signal<Company[]>([]);
  readonly cycles = signal<Cycle[]>([]);
  readonly chains = signal<Chain[]>([]);
  readonly openObligations = signal<Obligation[]>([]);
  readonly simulation = signal<SimulationResult | null>(null);
  readonly simulating = signal(false);

  readonly companyColumns = ['name', 'nit', 'legal_type', 'sector'];
  readonly cycleColumns = ['cycle', 'length', 'volume', 'compensation'];
  readonly chainColumns = ['chain', 'length', 'volume', 'compensation', 'ends_in_cycle'];
  readonly obligationColumns = ['debtor', 'creditor', 'balance', 'due', 'status'];

  constructor() {
    this.api.getNetworkStatistics().subscribe((s) => this.stats.set(s));
    this.api.getAdminCompanies().subscribe((c) => this.companies.set(c));
    this.api.getCycles().subscribe((c) => this.cycles.set(c));
    this.api.getOpenChains().subscribe((c) => this.chains.set(c));
    this.api.getAdminObligations().subscribe((o) => this.openObligations.set(o));
  }

  runSimulation(): void {
    this.simulating.set(true);
    this.api.runSimulation().subscribe({
      next: (r) => {
        this.simulation.set(r);
        this.simulating.set(false);
      },
      error: () => this.simulating.set(false),
    });
  }

  asNumber(value: string | undefined): number {
    return value ? parseFloat(value) : 0;
  }

  statusLabel(s: ObligationStatus): string {
    return STATUS_LABELS[s];
  }
}
