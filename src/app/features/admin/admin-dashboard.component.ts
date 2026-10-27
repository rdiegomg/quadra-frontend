import { DatePipe, DecimalPipe, KeyValuePipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import { I18nService, TranslatePipe } from '../../core/i18n';
import {
  AdminProposal,
  Chain,
  Company,
  Cycle,
  NetworkStatistics,
  Obligation,
  ObligationStatus,
  SimulationResult,
} from '../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    DatePipe,
    DecimalPipe,
    KeyValuePipe,
    PercentPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    MatTableModule,
    TranslatePipe,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent {
  private readonly api = inject(ApiService);
  protected readonly i18n = inject(I18nService);

  readonly stats = signal<NetworkStatistics | null>(null);
  readonly companies = signal<Company[]>([]);
  readonly cycles = signal<Cycle[]>([]);
  readonly chains = signal<Chain[]>([]);
  readonly openObligations = signal<Obligation[]>([]);
  readonly proposals = signal<AdminProposal[]>([]);
  readonly simulation = signal<SimulationResult | null>(null);
  readonly simulating = signal(false);
  readonly filterCompanyId = signal<number | null>(null);

  readonly filteredObligations = computed(() => {
    const f = this.filterCompanyId();
    const all = this.openObligations();
    if (f === null) return all;
    return all.filter((o) => o.debtor.id === f || o.creditor.id === f);
  });

  readonly companyColumns = ['name', 'nit', 'legal_type', 'sector'];
  readonly cycleColumns = ['cycle', 'length', 'volume', 'compensation'];
  readonly chainColumns = ['chain', 'length', 'volume', 'compensation', 'ends_in_cycle'];
  readonly obligationColumns = ['debtor', 'creditor', 'balance', 'due', 'status'];
  readonly proposalColumns = ['hProposal', 'hLength', 'hVotes', 'hAmount', 'hStatus', 'hDate'];

  constructor() {
    this.api.getNetworkStatistics().subscribe((s) => this.stats.set(s));
    this.api.getAdminCompanies().subscribe((c) => this.companies.set(c));
    this.api.getCycles().subscribe((c) => this.cycles.set(c));
    this.api.getOpenChains().subscribe((c) => this.chains.set(c));
    this.api.getAdminObligations().subscribe((o) => this.openObligations.set(o));
    this.api.getAdminProposals().subscribe((p) => this.proposals.set(p));
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
    return this.i18n.t(`status.${s}`);
  }
}
