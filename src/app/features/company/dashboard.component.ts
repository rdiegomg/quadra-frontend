import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Company, CompanySummary } from '../../core/models';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  readonly company = signal<Company | null>(null);
  readonly summary = signal<CompanySummary | null>(null);

  constructor() {
    this.api.getMyCompany().subscribe((c) => this.company.set(c));
    this.api.getMySummary().subscribe((s) => this.summary.set(s));
  }

  asNumber(value: string | undefined): number {
    return value ? parseFloat(value) : 0;
  }
}
