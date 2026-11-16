import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Acta } from '../../core/models';
import { TranslatePipe } from '../../core/i18n';

@Component({
  selector: 'app-acta-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe, DecimalPipe, TranslatePipe],
  template: `
    <div class="acta-doc">
      <div class="acta-head">
        <h2>{{ 'acta.title' | t }}</h2>
        <span class="acta-num">{{ data.acta_number }}</span>
      </div>
      <p class="acta-date">
        {{ 'acta.issued' | t: { date: (data.executed_at | date: "d 'de' MMMM 'de' y, HH:mm") } }}
      </p>

      <h3>{{ 'acta.parties' | t }}</h3>
      <ul class="parties">
        @for (p of data.companies; track p.id) {
          <li>
            <strong>{{ p.name }}</strong>
            <span class="muted">{{ p.legal_type }} · NIT {{ p.nit }}</span>
          </li>
        }
      </ul>

      <h3>{{ 'acta.tranches' | t }}</h3>
      <div class="tranches-scroll">
      <table class="tranches">
        <thead>
          <tr>
            <th>{{ 'acta.col.debtor' | t }}</th>
            <th>{{ 'acta.col.creditor' | t }}</th>
            <th class="num">{{ 'acta.col.before' | t }}</th>
            <th class="num">{{ 'acta.col.cancelled' | t }}</th>
            <th class="num">{{ 'acta.col.residual' | t }}</th>
          </tr>
        </thead>
        <tbody>
          @for (tr of data.tranches; track $index) {
            <tr>
              <td>{{ tr.debtor_name }}</td>
              <td>{{ tr.creditor_name }}</td>
              <td class="num">{{ num(tr.balance_before) | number: '1.0-0' }}</td>
              <td class="num cancelled">{{ num(tr.cancelled) | number: '1.0-0' }}</td>
              <td class="num">{{ num(tr.residual) | number: '1.0-0' }}</td>
            </tr>
          }
        </tbody>
      </table>
      </div>

      <div class="acta-total">
        <span>{{ 'acta.total' | t }}</span>
        <strong>{{ num(data.total_cancelled) | number: '1.0-0' }} {{ data.currency }}</strong>
      </div>

      <p class="acta-clause">
        {{ 'acta.clause' | t }}
      </p>
    </div>
    <mat-dialog-actions align="end">
      <button mat-button (click)="print()">
        <mat-icon>print</mat-icon> {{ 'acta.print' | t }}
      </button>
      <button mat-flat-button mat-dialog-close>{{ 'acta.close' | t }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    .acta-doc { width: min(540px, 100%); box-sizing: border-box; }
    .acta-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
    .acta-head h2 { margin: 0; font-size: 1.15rem; letter-spacing: 0.02em; }
    .acta-num { font-family: ui-monospace, monospace; font-weight: 700; color: var(--mat-sys-primary); }
    .acta-date { font-size: 0.8rem; color: var(--mat-sys-on-surface-variant); margin: 4px 0 16px; }
    h3 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mat-sys-on-surface-variant); margin: 18px 0 8px; }
    .parties { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .parties li { display: flex; flex-direction: column; }
    .muted { font-size: 0.75rem; color: var(--mat-sys-on-surface-variant); }
    .tranches-scroll { overflow-x: auto; }
    .tranches { width: 100%; min-width: 420px; border-collapse: collapse; font-size: 0.8rem; }
    .tranches th { text-align: left; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mat-sys-on-surface-variant); border-bottom: 1px solid var(--mat-sys-outline-variant); padding: 6px 8px; }
    .tranches td { padding: 8px; border-bottom: 1px solid var(--mat-sys-outline-variant); }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .cancelled { color: var(--mat-sys-primary); font-weight: 600; }
    .acta-total { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding: 10px 12px; background: var(--mat-sys-surface-container-low); border-radius: 8px; }
    .acta-clause { font-size: 0.72rem; color: var(--mat-sys-on-surface-variant); margin-top: 14px; line-height: 1.5; }
  `,
})
export class ActaDialogComponent {
  readonly data = inject<Acta>(MAT_DIALOG_DATA);

  num(v: string): number {
    return parseFloat(v) || 0;
  }

  print(): void {
    window.print();
  }
}
