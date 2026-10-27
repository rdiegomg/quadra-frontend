import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { I18nService, TranslatePipe } from '../../core/i18n';
import { ImportDialogComponent } from './import-dialog.component';
import {
  InstallmentStatus,
  Obligation,
  ObligationStatus,
  PaymentFrequency,
  PaymentScheduleItem,
} from '../../core/models';

const FREQUENCIES: PaymentFrequency[] = [
  'ONE_TIME',
  'MONTHLY',
  'QUARTERLY',
  'SEMIANNUAL',
  'ANNUAL',
];

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
    MatDialogModule,
    TranslatePipe,
  ],
  templateUrl: './obligations.component.html',
  styleUrl: './obligations.component.css',
})
export class ObligationsComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  readonly receivable = signal<Obligation[]>([]);
  readonly payable = signal<Obligation[]>([]);
  readonly saving = signal(false);
  readonly scheduleObligation = signal<Obligation | null>(null);
  readonly schedules = signal<PaymentScheduleItem[]>([]);
  readonly schedulesLoading = signal(false);

  readonly frequencies = FREQUENCIES;
  readonly columns = ['counterparty', 'amount', 'balance', 'due', 'status', 'actions'];
  readonly scheduleColumns = ['installment', 'sDue', 'sAmount', 'sStatus'];
  readonly OPEN_STATUSES: ObligationStatus[] = ['PENDING', 'PARTIAL', 'OVERDUE'];

  readonly form = this.fb.nonNullable.group({
    counterparty_nit: ['', [Validators.required, Validators.minLength(4)]],
    reference: [''],
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
    // Prellenado desde una "Oportunidad" del dashboard (eslabon faltante).
    const q = this.route.snapshot.queryParamMap;
    const nit = q.get('nit');
    const direction = q.get('direction');
    if (nit) this.form.patchValue({ counterparty_nit: nit });
    if (direction === 'payable' || direction === 'receivable') {
      this.form.patchValue({
        direction: direction.toUpperCase() as 'PAYABLE' | 'RECEIVABLE',
      });
    }
  }

  reload(): void {
    this.api.getObligations('receivable').subscribe((o) => this.receivable.set(o));
    this.api.getObligations('payable').subscribe((o) => this.payable.set(o));
  }

  canClose(o: Obligation): boolean {
    return CLOSABLE.includes(o.status);
  }

  dueLabel(o: Obligation): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(o.due_date + 'T00:00:00');
    const days = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (days === 0) return this.i18n.t('due.today');
    if (days === 1) return this.i18n.t('due.tomorrow');
    if (days > 1) return this.i18n.t('due.in', { days });
    if (days === -1) return this.i18n.t('due.yesterday');
    return this.i18n.t('due.ago', { days: -days });
  }

  openImport(): void {
    this.dialog
      .open(ImportDialogComponent, { width: '520px' })
      .afterClosed()
      .subscribe((reload) => {
        if (reload) {
          this.reload();
          this.snack.open(this.i18n.t('ob.snack.imported'), 'OK', { duration: 3000 });
        }
      });
  }

  labelOf(o: Obligation): string {
    return this.i18n.t(`status.${o.status}`);
  }

  installmentLabel(s: InstallmentStatus): string {
    return this.i18n.t(`status.${s}`);
  }

  toggleSchedules(o: Obligation): void {
    if (this.scheduleObligation()?.id === o.id) {
      this.scheduleObligation.set(null);
      return;
    }
    this.scheduleObligation.set(o);
    this.schedulesLoading.set(true);
    this.api.getSchedules(o.id).subscribe({
      next: (s) => {
        this.schedules.set(s);
        this.schedulesLoading.set(false);
      },
      error: () => {
        this.schedules.set([]);
        this.schedulesLoading.set(false);
      },
    });
  }

  cancel(o: Obligation): void {
    if (!window.confirm(this.i18n.t('ob.confirmCancel', { n: o.id }))) return;
    this.api.updateStatus(o.id, 'CANCELLED').subscribe({
      next: () => {
        this.snack.open(this.i18n.t('ob.snack.cancelled', { n: o.id }), 'OK', {
          duration: 3000,
        });
        if (this.scheduleObligation()?.id === o.id) this.scheduleObligation.set(null);
        this.reload();
      },
      error: (err) =>
        this.snack.open(err.error?.detail ?? this.i18n.t('ob.err.cancel'), 'OK', {
          duration: 4000,
        }),
    });
  }

  markPaid(o: Obligation): void {
    this.api.updateStatus(o.id, 'PAID').subscribe({
      next: () => {
        this.snack.open(this.i18n.t('ob.snack.paid', { n: o.id }), 'OK', {
          duration: 3000,
        });
        this.reload();
      },
      error: (err) =>
        this.snack.open(err.error?.detail ?? this.i18n.t('ob.err.update'), 'OK', {
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
          this.snack.open(this.i18n.t('ob.snack.doc', { n: o.id }), 'OK', {
            duration: 3000,
          }),
        error: (err) =>
          this.snack.open(err.error?.detail ?? this.i18n.t('ob.err.doc'), 'OK', {
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
        reference: v.reference || undefined,
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
          this.snack.open(this.i18n.t('ob.snack.created', { n: o.id }), 'OK', {
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
          this.snack.open(err.error?.detail ?? this.i18n.t('ob.err.create'), 'OK', {
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
