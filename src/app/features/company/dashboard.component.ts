import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Company, CompanySummary, MyChain } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);

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
  }

  toggleDetail(i: number): void {
    this.expanded.set(this.expanded() === i ? null : i);
  }

  acceptChain(i: number): void {
    this.accepted.update((s) => new Set(s).add(i));
    this.snack.open(
      'Cadena aceptada (simulado — el acta se firmaría cuando todas acepten)',
      'OK',
      { duration: 4000 },
    );
  }

  chainTitle(c: MyChain): string {
    return c.kind === 'cycle'
      ? `Cadena cerrada · ${c.length} empresas`
      : `Cadena abierta · ${c.length} empresas`;
  }

  participantsLine(c: MyChain): string {
    const named = c.named_participants.join(', ');
    return c.anonymized_count > 0
      ? `${named} y ${c.anonymized_count} más`
      : named;
  }

  positionNote(c: MyChain): string {
    switch (c.my_position) {
      case 'source':
        return 'Eres el primer eslabón: tu deuda se reduce sin renunciar cobros.';
      case 'sink':
        return 'Eres el último eslabón: aceptas recibir menos a cambio de cerrar la cadena.';
      case 'middle':
        return 'Posición neta sin cambios: pagas menos y cobras menos.';
      default:
        return 'Posición neta sin cambios: se te cancela lo mismo que dejas de cobrar.';
    }
  }

  asNumber(value: string | null | undefined): number {
    return value ? parseFloat(value) : 0;
  }
}
