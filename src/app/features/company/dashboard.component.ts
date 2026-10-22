import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService, TranslatePipe } from '../../core/i18n';
import { Company, CompanySummary, MyChain } from '../../core/models';
import { ChainRingComponent } from './chain-ring.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    ChainRingComponent,
    TranslatePipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  private readonly snack = inject(MatSnackBar);

  readonly sectors = signal<Map<string, string>>(new Map());

  readonly company = signal<Company | null>(null);
  readonly summary = signal<CompanySummary | null>(null);
  readonly chains = signal<MyChain[]>([]);
  readonly expanded = signal<number | null>(null);
  readonly accepted = signal<Set<number>>(new Set());

  readonly compensableTotal = computed(() =>
    this.chains().reduce(
      (sum, c) => sum + this.asNumber(c.cancelled_amount),
      0,
    ),
  );

  readonly initials = computed(() => {
    const name = this.company()?.name ?? '';
    return name
      .split(/\s+/)
      .filter((w) => /^[A-Za-zÁÉÍÓÚÑ]/.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  });

  constructor() {
    this.api.getMyCompany().subscribe((c) => this.company.set(c));
    this.api.getMySummary().subscribe((s) => this.summary.set(s));
    this.api.getMyChains().subscribe((c) => this.chains.set(c));
    this.api.getMyNetwork().subscribe((n) => {
      const map = new Map<string, string>();
      n.nodes.forEach((nd) => {
        if (nd.sector) map.set(nd.label, nd.sector);
      });
      this.sectors.set(map);
    });
  }

  toggleDetail(i: number): void {
    this.expanded.set(this.expanded() === i ? null : i);
  }

  acceptChain(i: number): void {
    this.accepted.update((s) => new Set(s).add(i));
    this.snack.open(this.i18n.t('dash.snackAccept'), 'OK', { duration: 4000 });
  }

  chainTitle(c: MyChain): string {
    return this.i18n.t(c.kind === 'cycle' ? 'dash.title.closed' : 'dash.title.open', {
      n: c.length,
    });
  }

  participantsLine(c: MyChain): string {
    const named = c.named_participants.join(', ');
    return c.anonymized_count > 0
      ? `${named} ${this.i18n.t('dash.andMore', { n: c.anonymized_count })}`
      : named;
  }

  positionNote(c: MyChain): string {
    switch (c.my_position) {
      case 'source':
        return this.i18n.t('dash.note.source');
      case 'sink':
        return this.i18n.t('dash.note.sink');
      case 'middle':
        return this.i18n.t('dash.note.middle');
      default:
        return this.i18n.t('dash.note.cycle');
    }
  }

  asNumber(value: string | null | undefined): number {
    return value ? parseFloat(value) : 0;
  }
}
