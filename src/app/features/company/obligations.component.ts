import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/api.service';
import {
  Obligation,
  ObligationStatus,
  PaymentFrequency,
} from '../../core/models';

const FREQUENCIES: { value: PaymentFrequency; label: string }[] = [
  { value: 'ONE_TIME', label: 'Pago único' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'SEMIANNUAL', label: 'Semestral' },
  { value: 'ANNUAL', label: 'Anual' },
];

const STATUS_LABELS: Record<ObligationStatus, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
};

const CLOSABLE: ObligationStatus[] = ['PENDING', 'PARTIAL', 'OVERDUE'];

@Component({
  selector: 'app-obligations',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    NgTemplateOutlet,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatSnackBarModule,
  ],
  templateUrl: './obligations.component.html',
  styleUrl: './obligations.component.css',
})
export class ObligationsComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  readonly receivable = signal<Obligation[]>([]);
  readonly payable = signal<Obligation[]>([]);
  readonly saving = signal(false);

  readonly frequencies = FREQUENCIES;
  readonly statusLabels = STATUS_LABELS;
  readonly columns = ['counterparty', 'amount', 'balance', 'due', 'status', 'actions'];

  readonly form = this.fb.nonNullable.group({
    counterparty_nit: ['', [Validators.required, Validators.minLength(4)]],
    direction: ['PAYABLE' as 'PAYABLE' | 'RECEIVABLE', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    currency: ['BOB', Validators.required],
    interest_rate: [null as number | null],
    origin_date: [new Date().toISOString().slice(0, 10), Validators.required],
    due_date: ['', Validators.required],
    payment_frequency: ['ONE_TIME' as PaymentFrequency, Validators.required],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.api.getObligations('receivable').subscribe((o) => this.receivable.set(o));
    this.api.getObligations('payable').subscribe((o) => this.payable.set(o));
  }

  canClose(o: Obligation): boolean {
    return CLOSABLE.includes(o.status);
  }

  labelOf(o: Obligation): string {
    return STATUS_LABELS[o.status];
  }

  markPaid(o: Obligation): void {
    this.api.updateStatus(o.id, 'PAID').subscribe({
      next: () => {
        this.snack.open(`Obligación #${o.id} marcada como pagada`, 'OK', {
          duration: 3000,
        });
        this.reload();
      },
      error: (err) =>
        this.snack.open(err.error?.detail ?? 'No se pudo actualizar', 'OK', {
          duration: 4000,
        }),
    });
  }

  attachDocument(o: Obligation, input: HTMLInputElement): void {
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      this.api.uploadDocument(o.id, file).subscribe({
        next: () =>
          this.snack.open(`Documento adjuntado a #${o.id}`, 'OK', {
            duration: 3000,
          }),
        error: (err) =>
          this.snack.open(err.error?.detail ?? 'Error al subir', 'OK', {
            duration: 4000,
          }),
      });
      input.value = '';
    };
    input.click();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.api
      .createObligation({
        counterparty_nit: v.counterparty_nit,
        direction: v.direction,
        amount: v.amount!,
        currency: v.currency,
        interest_rate: v.interest_rate ?? undefined,
        origin_date: v.origin_date,
        due_date: v.due_date,
        payment_frequency: v.payment_frequency,
      })
      .subscribe({
        next: (o) => {
          this.saving.set(false);
          this.snack.open(`Obligación #${o.id} registrada`, 'OK', {
            duration: 3000,
          });
          this.form.reset({
            direction: 'PAYABLE',
            currency: 'BOB',
            origin_date: new Date().toISOString().slice(0, 10),
            payment_frequency: 'ONE_TIME',
          });
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.snack.open(err.error?.detail ?? 'No se pudo registrar', 'OK', {
            duration: 4000,
          });
        },
      });
  }

  counterpartyOf(o: Obligation, view: 'receivable' | 'payable') {
    return view === 'receivable' ? o.debtor : o.creditor;
  }

  asNumber(value: string): number {
    return parseFloat(value);
  }
}
