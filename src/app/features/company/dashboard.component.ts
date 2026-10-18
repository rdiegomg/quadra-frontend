import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth/auth.service';
import {
  Company,
  CompanySummary,
  CompensationProposal,
} from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatSnackBarModule, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);

  readonly company = signal<Company | null>(null);
  readonly summary = signal<CompanySummary | null>(null);
  readonly proposal = signal<CompensationProposal | null>(null);
  readonly proposalState = signal<'idle' | 'accepted' | 'declined'>('idle');

  constructor() {
    this.api.getMyCompany().subscribe((c) => this.company.set(c));
    this.api.getMySummary().subscribe((s) => this.summary.set(s));
    this.api.getMyProposal().subscribe((p) => this.proposal.set(p));
  }

  respondProposal(accept: boolean): void {
    this.proposalState.set(accept ? 'accepted' : 'declined');
    this.snack.open(
      accept
        ? 'Propuesta aceptada (simulado — pendiente de formalización)'
        : 'Propuesta rechazada (simulado)',
      'OK',
      { duration: 3500 },
    );
  }

  asNumber(value: string | undefined): number {
    return value ? parseFloat(value) : 0;
  }
}
