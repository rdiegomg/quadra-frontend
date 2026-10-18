import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import cytoscape, { Core, StylesheetJson } from 'cytoscape';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme.service';
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
export class DashboardComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);
  private readonly theme = inject(ThemeService);

  private chainCanvas = viewChildren<ElementRef<HTMLDivElement>>('chainCanvas');
  private chainCy: Core | null = null;
  private sectors = new Map<string, string>();

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
    this.api.getMyNetwork().subscribe((n) =>
      n.nodes.forEach((nd) => {
        if (nd.sector) this.sectors.set(nd.label, nd.sector);
      }),
    );

    // Cuando el canvas del detalle expandido existe en el DOM, dibujo el anillo
    effect(() => {
      const i = this.expanded();
      const canvas = this.chainCanvas()[0];
      if (i !== null && canvas) this.renderChainMap(i);
    });
  }

  ngOnDestroy(): void {
    this.chainCy?.destroy();
  }

  toggleDetail(i: number): void {
    if (this.expanded() === i) {
      this.expanded.set(null);
      this.chainCy?.destroy();
      this.chainCy = null;
      return;
    }
    this.chainCy?.destroy();
    this.chainCy = null;
    this.expanded.set(i);
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

  /* ---- Mapa de anillo por cadena (estilo prototipo) ---- */

  private renderChainMap(i: number): void {
    const chain = this.chains()[i];
    const canvas = this.chainCanvas()[0];
    if (!chain || !canvas) return;

    const el = canvas.nativeElement;
    const isCycle = chain.kind === 'cycle';
    const n = chain.labels.length;

    // Me encuentro por las aristas (debtor_is_me => soy el deudor de esa arista)
    let meIdx = chain.edges.findIndex((e) => e.debtor_is_me);
    if (meIdx === -1) {
      meIdx = chain.edges.findIndex((e) => e.creditor_is_me) + 1;
    }

    // En ciclos rotamos para que "yo" quede arriba (12 en punto)
    const order = isCycle
      ? [...Array(n).keys()].map((k) => (k + meIdx) % n)
      : [...Array(n).keys()];
    // Reordeno las aristas siguiendo el nuevo orden de nodos
    const edges = isCycle
      ? [...chain.edges.slice(meIdx), ...chain.edges.slice(0, meIdx)]
      : chain.edges;

    const total = isCycle ? n : n + 1; // cadena abierta: +1 nodo fantasma
    // Ciclos siempre en anillo (el radio crece con los eslabones);
    // abiertas cortas tambien en anillo; abiertas largas en serpiente
    const w0 = el.clientWidth || 600;
    const ringRadius = Math.min(Math.max(96, 23 * total), w0 / 2 - 150);
    const useRing = isCycle || total <= 5;
    const dark = this.theme.isDark();

    let cols = 1;
    let rows = 1;
    if (useRing) {
      el.style.height = `${Math.max(340, ringRadius * 2 + 175)}px`;
    } else {
      cols = Math.max(3, Math.min(6, Math.floor(w0 / 150)));
      rows = Math.ceil(total / cols);
      el.style.height = `${Math.max(340, 150 + rows * 150)}px`;
    }

    const w = el.clientWidth || 600;
    const h = el.clientHeight || 340;
    const cx = w / 2;
    const cy = h / 2 + 6;

    const posOf = (pos: number): { x: number; y: number; zone: string } => {
      if (useRing) {
        const angle = (-90 + (360 / total) * pos) * (Math.PI / 180);
        return {
          x: cx + ringRadius * Math.cos(angle),
          y: cy + ringRadius * Math.sin(angle),
          zone: `pos-${this.angleZone(angle)}`,
        };
      }
      const row = Math.floor(pos / cols);
      const raw = pos % cols;
      const col = row % 2 === 0 ? raw : cols - 1 - raw;
      return {
        x: cols === 1 ? cx : 90 + (col * (w - 180)) / (cols - 1),
        y: rows === 1 ? cy : 85 + (row * (h - 170)) / (rows - 1),
        zone: '',
      };
    };

    const nodeDefs: cytoscape.ElementDefinition[] = order.map((idx, pos) => {
      const label = chain.labels[idx];
      const anonymous = label.startsWith('Empresa de ');
      const isMe = idx === meIdx;
      const { x, y, zone } = posOf(pos);
      const sub = isMe
        ? 'Tú'
        : anonymous
          ? 'Identidad protegida'
          : (this.sectors.get(label) ?? 'Contraparte');
      return {
        data: { id: `n${pos}`, display: `${label}\n${sub}` },
        position: { x, y },
        classes: [isMe ? 'me' : '', anonymous ? 'anon' : '', zone]
          .filter(Boolean)
          .join(' '),
        style: anonymous
          ? {
              'background-image': this.lockImage(dark),
              'background-width': '45%',
              'background-height': '45%',
            }
          : {
              'background-image': this.initialsImage(this.initialsOf(label)),
              'background-width': '100%',
              'background-height': '100%',
            },
      };
    });

    if (!isCycle) {
      // nodo fantasma donde faltaria el eslabon que cierra la cadena
      const g = posOf(n);
      nodeDefs.push({
        data: { id: 'ghost', display: '' },
        position: { x: g.x, y: g.y },
        classes: 'ghost',
        style: {},
      });
    }

    // sag del arco: distancia del punto medio de la cuerda al circulo,
    // hace que las aristas sigan la curvatura del anillo
    const sag = Math.max(10, ringRadius * (1 - Math.cos(Math.PI / total)));
    const arcStyle = useRing
      ? {
          'curve-style': 'unbundled-bezier',
          'control-point-distances': `${sag}`,
          'control-point-weights': '0.5',
        }
      : {};
    const edgeDefs: cytoscape.ElementDefinition[] = edges.map((e, k) => ({
      data: {
        id: `e${k}`,
        source: `n${k}`,
        target: `n${k + 1}`,
        label: e.balance !== null ? `Bs ${this.fmt(e.balance)}` : 'Monto privado',
      },
      classes: e.balance !== null ? 'mine' : 'priv',
      style: { ...arcStyle },
    }));
    if (isCycle) {
      // ultima arista del ciclo cierra: n{n-1} -> n0
      edgeDefs[edgeDefs.length - 1].data.target = 'n0';
    } else {
      // la cadena abierta muestra el eslabon faltante como arco fantasma
      edgeDefs.push(
        {
          data: {
            id: 'ghost-in',
            source: `n${n - 1}`,
            target: 'ghost',
            label: '',
          },
          classes: 'ghost',
          style: { ...arcStyle },
        },
        {
          data: {
            id: 'ghost-out',
            source: 'ghost',
            target: 'n0',
            label: 'Falta este eslabón',
          },
          classes: 'ghost',
          style: { ...arcStyle },
        },
      );
    }

    this.chainCy = cytoscape({
      container: el,
      elements: [...nodeDefs, ...edgeDefs],
      style: this.chainStylesheet(dark),
      layout: { name: 'preset' } as cytoscape.LayoutOptions,
      userZoomingEnabled: false,
      userPanningEnabled: false,
      boxSelectionEnabled: false,
    });
    this.chainCy.nodes().ungrabify();
  }

  private angleZone(angle: number): 'top' | 'right' | 'bottom' | 'left' {
    const deg = ((angle * 180) / Math.PI + 360) % 360;
    if (deg >= 45 && deg < 135) return 'bottom';
    if (deg >= 135 && deg < 225) return 'left';
    if (deg >= 225 && deg < 315) return 'top';
    return 'right';
  }

  private initialsOf(name: string): string {
    return name
      .replace(/\s+(S\.?A\.?|S\.?R\.?L\.?|S\.?C\.?A\.?|LTDA\.?|SRL|SA|SCA)$/i, '')
      .split(/\s+/)
      .filter((w) => /^[A-Za-zÁÉÍÓÚÑ0-9]/.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  private fmt(v: string): string {
    return Number(v).toLocaleString('es-BO', { maximumFractionDigits: 0 });
  }

  private initialsImage(initials: string): string {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const ctx = c.getContext('2d')!;
    ctx.font = 'bold 38px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(initials, 48, 52);
    return c.toDataURL();
  }

  private lockImage(dark: boolean): string {
    const stroke = dark ? '#8fa2c7' : '#9aa3b8';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  private chainStylesheet(dark: boolean): StylesheetJson {
    const ink = dark ? '#e6e9f2' : '#23293a';
    const meFill = dark ? '#23293a' : '#23293a';
    const labelColor = dark ? '#e6e9f2' : '#2a2f3d';
    const subColor = dark ? '#9aa3b8' : '#6b7280';
    return [
      {
        selector: 'node',
        style: {
          shape: 'ellipse',
          width: 58,
          height: 58,
          'background-color': '#b5653f',
          'border-width': 0,
          label: 'data(display)',
          'text-wrap': 'wrap',
          'text-max-width': '110px',
          'font-size': 10,
          'font-weight': 700,
          color: labelColor,
          'text-valign': 'bottom',
          'text-margin-y': 8,
          events: 'no',
        },
      },
      {
        selector: 'node.me',
        style: {
          'background-color': meFill,
          'border-width': 5,
          'border-color': '#cf8a63',
          width: 64,
          height: 64,
        },
      },
      {
        selector: 'node.anon',
        style: {
          'background-color': dark ? '#23293a' : '#ffffff',
          'border-width': 1.5,
          'border-color': dark ? '#5f6b85' : '#c3c9d8',
        },
      },
      {
        selector: 'node.ghost',
        style: {
          'background-color': 'transparent',
          'border-width': 2,
          'border-color': dark ? '#5f6b85' : '#b9bfcc',
          'border-style': 'dashed',
          label: '?',
          'font-size': 18,
          'font-weight': 700,
          color: subColor,
          'text-valign': 'center',
          'text-margin-y': 0,
        },
      },
      // posiciones radiales para la etiqueta
      {
        selector: 'node.pos-top',
        style: { 'text-valign': 'top', 'text-margin-y': -8 },
      },
      {
        selector: 'node.pos-left',
        style: {
          'text-valign': 'center',
          'text-halign': 'right',
          'text-margin-x': -8,
          'text-margin-y': 0,
        },
      },
      {
        selector: 'node.pos-right',
        style: {
          'text-valign': 'center',
          'text-halign': 'left',
          'text-margin-x': 8,
          'text-margin-y': 0,
        },
      },
      {
        selector: 'edge',
        style: {
          width: 12,
          'curve-style': 'bezier',
          'target-arrow-shape': 'none',
          'mid-target-arrow-shape': 'triangle',
          'mid-target-arrow-color': '#f5f0ea',
          'arrow-scale': 1.3,
          'source-distance-from-node': 14,
          'target-distance-from-node': 14,
          label: 'data(label)',
          'font-size': 10,
          'font-weight': 600,
          color: ink,
          // desliza la pastilla del monto mas alla del medio para no tapar la flecha
          ...({ 'edge-text-offset': 30 } as object),
          'text-background-color': dark ? '#23293a' : '#ffffff',
          'text-background-opacity': 1,
          'text-background-padding': '5px',
          'text-background-shape': 'roundrectangle',
          'text-border-width': 1,
          'text-border-color': dark ? '#3d465c' : '#e3e6ee',
          events: 'no',
        },
      },
      {
        selector: 'edge.mine',
        style: {
          'line-color': dark ? '#8fa2c7' : '#23293a',
        },
      },
      {
        selector: 'edge.priv',
        style: {
          'line-color': '#b5653f',
        },
      },
      {
        selector: 'edge.priv, edge.ghost',
        style: {
          'font-style': 'italic',
          'font-weight': 500,
          color: subColor,
        },
      },
      {
        selector: 'edge.ghost',
        style: {
          'line-color': dark ? '#5f6b85' : '#b9bfcc',
          'line-style': 'dashed',
          width: 3.5,
          'mid-target-arrow-color': dark ? '#5f6b85' : '#b9bfcc',
          opacity: 0.8,
        },
      },
    ];
  }
}
