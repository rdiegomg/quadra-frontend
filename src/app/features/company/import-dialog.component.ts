import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/api.service';
import { I18nService, TranslatePipe } from '../../core/i18n';
import { ImportResult } from '../../core/models';

@Component({
  selector: 'app-import-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'imp.title' | t }}</h2>
    <mat-dialog-content>
      <p class="intro">
        {{ 'imp.intro' | t }}
      </p>

      <div class="format">
        <strong>{{ 'imp.fmt' | t }}</strong>
        <code>tipo,nit_contraparte,monto,fecha_emision,fecha_vencimiento,nro_factura</code>
        <code>cobrar,3365120015,15000,2026-09-18,2026-11-18,0815</code>
        <code>pagar,2874510019,8900,2026-09-15,2026-10-15,4621</code>
        <small>
          {{ 'imp.fmtNote' | t }}
        </small>
      </div>

      @if (!result()) {
        <button mat-stroked-button class="file-btn" (click)="fileInput.click()" [disabled]="uploading()">
          @if (uploading()) {
            <mat-spinner diameter="18" /> {{ 'imp.uploading' | t }}
          } @else {
            <ng-container><mat-icon>upload_file</mat-icon></ng-container> {{ 'imp.choose' | t }}
          }
        </button>
        <input #fileInput type="file" accept=".csv" hidden (change)="upload($event)" />
      } @else {
        <div class="result">
          <div class="result-ok">
            <mat-icon>check_circle</mat-icon>
            <strong>{{ 'imp.imported' | t: { n: result()!.created } }}</strong>
          </div>
          @if (result()!.skipped.length > 0) {
            <p class="skipped-title">{{ 'imp.skipped' | t: { n: result()!.skipped.length } }}</p>
            <ul class="skipped">
              @for (s of result()!.skipped; track s.row) {
                <li>{{ 'imp.row' | t: { n: s.row } }} — {{ s.reason }}</li>
              }
            </ul>
          }
        </div>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (result()) {
        <button mat-flat-button (click)="close(true)">{{ 'imp.done' | t }}</button>
      } @else {
        <button mat-button (click)="close(false)">{{ 'imp.cancel' | t }}</button>
      }
    </mat-dialog-actions>
  `,
  styles: `
    .intro { font-size: 0.88rem; color: var(--mat-sys-on-surface-variant); }
    .format {
      display: flex; flex-direction: column; gap: 4px;
      background: var(--mat-sys-surface-container-low);
      border-radius: 10px; padding: 12px; margin: 12px 0 18px;
    }
    .format strong { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mat-sys-on-surface-variant); }
    .format code { font-size: 0.75rem; white-space: pre-wrap; word-break: break-all; }
    .format small { font-size: 0.72rem; color: var(--mat-sys-on-surface-variant); margin-top: 4px; }
    .file-btn { width: 100%; height: 52px; border-style: dashed; display: flex; gap: 8px; align-items: center; justify-content: center; }
    .result-ok { display: flex; align-items: center; gap: 8px; color: #2e7d4f; }
    .skipped-title { font-size: 0.82rem; margin: 12px 0 4px; color: var(--mat-sys-on-surface-variant); }
    .skipped { margin: 0; padding-left: 18px; font-size: 0.78rem; color: var(--mat-sys-error); max-height: 140px; overflow: auto; }
    .error { color: var(--mat-sys-error); font-size: 0.82rem; }
  `,
})
export class ImportDialogComponent {
  private readonly api = inject(ApiService);
  private readonly ref = inject(MatDialogRef<ImportDialogComponent>);
  private readonly i18n = inject(I18nService);

  readonly uploading = signal(false);
  readonly result = signal<ImportResult | null>(null);
  readonly error = signal<string | null>(null);

  upload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    this.api.importObligationsCsv(file).subscribe({
      next: (r) => {
        this.uploading.set(false);
        this.result.set(r);
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err.error?.detail ?? this.i18n.t('imp.error'));
      },
    });
  }

  close(imported: boolean): void {
    this.ref.close(imported && (this.result()?.created ?? 0) > 0);
  }
}
