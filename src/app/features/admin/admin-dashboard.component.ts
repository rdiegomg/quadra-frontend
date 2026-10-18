import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import {
  Chain,
  Company,
  Cycle,
  NetworkStatistics,
} from '../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DecimalPipe, KeyValuePipe, MatCardModule, MatTabsModule, MatTableModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent {
  private readonly api = inject(ApiService);

  readonly stats = signal<NetworkStatistics | null>(null);
  readonly companies = signal<Company[]>([]);
  readonly cycles = signal<Cycle[]>([]);
  readonly chains = signal<Chain[]>([]);

  readonly companyColumns = ['name', 'nit', 'legal_type', 'sector'];
  readonly cycleColumns = ['cycle', 'length', 'volume', 'compensation'];
  readonly chainColumns = ['chain', 'length', 'volume', 'ends_in_cycle'];

  constructor() {
    this.api.getNetworkStatistics().subscribe((s) => this.stats.set(s));
    this.api.getAdminCompanies().subscribe((c) => this.companies.set(c));
    this.api.getCycles().subscribe((c) => this.cycles.set(c));
    this.api.getOpenChains().subscribe((c) => this.chains.set(c));
  }

  asNumber(value: string | undefined): number {
    return value ? parseFloat(value) : 0;
  }
}
