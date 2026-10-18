import { DecimalPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import cytoscape, { Core, NodeSingular, StylesheetJson } from 'cytoscape';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ThemeService } from '../../core/theme.service';
import {
  CompanySummary,
  MyChain,
  MyNetwork,
  MyNetworkNode,
} from '../../core/models';

interface SelectedInfo {
  label: string;
  sector: string | null;
  anonymous: boolean;
  isMe: boolean;
}

const LEGAL_SUFFIX =
  /\s+(S\.?A\.?|S\.?R\.?L\.?|S\.?C\.?A\.?|LTDA\.?|SRL|SA|SCA)$/i;

@Component({
  selector: 'app-my-network',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './my-network.component.html',
  styleUrl: './my-network.component.css',
})
export class MyNetworkComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);

  private graphCanvas = viewChild<ElementRef<HTMLDivElement>>('graphCanvas');

  private cy: Core | null = null;
  private readonly graph = signal<MyNetwork | null>(null);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly selected = signal<SelectedInfo | null>(null);
  readonly summary = signal<CompanySummary | null>(null);
  readonly chains = signal<MyChain[]>([]);

  readonly anonymousCount = signal(0);
  readonly myName = signal('');
  readonly myInitials = signal('');

  constructor() {
    forkJoin({
      graph: this.api.getMyNetwork(),
      summary: this.api.getMySummary(),
      chains: this.api.getMyChains(),
    }).subscribe({
      next: ({ graph, summary, chains }) => {
        this.graph.set(graph);
        this.summary.set(summary);
        this.chains.set(chains);
        this.anonymousCount.set(graph.nodes.filter((n) => n.anonymous).length);
        const me = graph.nodes.find((n) => n.is_me);
        if (me) {
          this.myName.set(me.label);
          this.myInitials.set(this.initials(me.label));
        }
        this.loading.set(false);
      },
      error: () => this.loadError.set(true),
    });

    effect(() => {
      const g = this.graph();
      const canvas = this.graphCanvas();
      if (g && canvas) this.renderGraph(g, canvas);
    });
    effect(() => {
      const dark = this.theme.isDark();
      this.cy?.style(this.stylesheet(dark));
    });
  }

  ngOnDestroy(): void {
    this.cy?.destroy();
  }

  fit(): void {
    this.cy?.fit(undefined, 40);
  }

  relayout(): void {
    this.cy?.layout(this.layoutOptions(true)).run();
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  asNumber(value: string | undefined): number {
    return value ? parseFloat(value) : 0;
  }

  netPosition(): number {
    return this.asNumber(this.summary()?.net_balance);
  }

  private initials(name: string): string {
    return name
      .replace(LEGAL_SUFFIX, '')
      .split(/\s+/)
      .filter((w) => /^[A-Za-zÁÉÍÓÚÑ0-9]/.test(w))
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  private shortName(name: string): string {
    return name.replace(LEGAL_SUFFIX, '').trim();
  }

  private pillLabel(n: MyNetworkNode): string {
    if (n.is_me) return this.initials(n.label);
    if (n.anonymous) {
      return (n.sector ?? 'Rubro').replace(/^Empresa de /, '');
    }
    return `${this.initials(n.label)} · ${this.shortName(n.label)}`;
  }

  private renderGraph(
    graph: MyNetwork,
    canvas: ElementRef<HTMLDivElement>,
  ): void {
    const elements = [
      ...graph.nodes.map((n: MyNetworkNode) => ({
        data: { ...n, pill: this.pillLabel(n) },
        classes: [
          n.is_me ? 'me' : '',
          n.anonymous ? 'anonymous' : '',
          n.is_counterparty ? 'counterparty' : '',
        ]
          .filter(Boolean)
          .join(' '),
      })),
      ...graph.edges.map((e) => ({
        data: {
          ...e,
          weight: e.balance ? Math.min(Number(e.balance), 200000) : 0,
          label:
            e.balance !== null
              ? `Bs ${this.compact(Number(e.balance))}`
              : '',
        },
        classes: [e.role, e.balance === null ? 'private' : '']
          .filter(Boolean)
          .join(' '),
      })),
    ];

    this.cy = cytoscape({
      container: canvas.nativeElement,
      elements,
      style: this.stylesheet(this.theme.isDark()),
      layout: this.layoutOptions(false),
      wheelSensitivity: 0.15,
      minZoom: 0.1,
      maxZoom: 3,
    });

    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      this.selected.set({
        label: node.data('label'),
        sector: node.data('sector'),
        anonymous: node.data('anonymous'),
        isMe: node.data('is_me'),
      });
    });
    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) this.selected.set(null);
    });
  }

  private compact(value: number): string {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toLocaleString('es-BO', { maximumFractionDigits: 0 })}k`;
    }
    return value.toLocaleString('es-BO', { maximumFractionDigits: 0 });
  }

  private layoutOptions(animate: boolean) {
    return {
      name: 'concentric',
      animate,
      animationDuration: 500,
      concentric: (node: NodeSingular) =>
        node.data('is_me') ? 2 : node.data('is_counterparty') ? 1 : 0,
      levelWidth: () => 1,
      minNodeSpacing: 26,
      padding: 60,
      startAngle: Math.PI / 2,
      clockwise: true,
    } as cytoscape.LayoutOptions;
  }

  private stylesheet(dark: boolean): StylesheetJson {
    const copper = '#b5653f';
    const copperLight = '#cf8a63';
    const closed = dark ? copperLight : copper;
    const open = dark ? '#8fa2c7' : '#3d465c';
    const other = dark ? '#4d566d' : '#c3c9d8';
    const pillBg = dark ? '#23293a' : '#ffffff';
    const pillBorder = dark ? '#3d465c' : '#d5dae4';
    const textColor = dark ? '#e6e9f2' : '#2a2f3d';
    const edgeLabelBg = dark ? 'rgba(27,30,41,0.8)' : 'rgba(255,255,255,0.85)';

    return [
      {
        selector: 'node',
        style: {
          shape: 'round-rectangle',
          width: 92,
          height: 24,
          'background-color': pillBg,
          'border-width': 1,
          'border-color': pillBorder,
          label: 'data(pill)',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': 8.5,
          'font-weight': 500,
          color: textColor,
          'text-wrap': 'ellipsis',
          'text-max-width': '80px',
        },
      },
      {
        selector: 'node.me',
        style: {
          shape: 'ellipse',
          width: 40,
          height: 40,
          'background-color': closed,
          'border-width': 3,
          'border-color': dark ? '#1b1e29' : '#ffffff',
          'font-size': 12,
          'font-weight': 'bold',
          color: '#ffffff',
          'text-outline-width': 0,
        },
      },
      {
        selector: 'node.counterparty',
        style: {
          'border-width': 1.5,
          'border-color': dark ? '#5f6b85' : '#9aa3b8',
        },
      },
      {
        selector: 'node.anonymous',
        style: {
          'background-color': dark ? '#1f2330' : '#f2f3f6',
          'border-style': 'dashed',
          'font-style': 'italic',
          color: dark ? '#9aa3b8' : '#6b7280',
          'font-size': 7.5,
        },
      },
      {
        selector: 'edge',
        style: {
          width: 'mapData(weight, 0, 200000, 1.2, 4)',
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.7,
          opacity: 0.9,
          label: 'data(label)',
          'font-size': 7.5,
          'font-weight': 600,
          'text-rotation': 'autorotate',
          'text-background-color': edgeLabelBg,
          'text-background-opacity': 1,
          'text-background-padding': '2px',
          'text-background-shape': 'roundrectangle',
          color: textColor,
          'line-color': other,
          'target-arrow-color': other,
        },
      },
      {
        selector: 'edge.cycle',
        style: {
          'line-color': closed,
          'target-arrow-color': closed,
          'line-style': 'solid',
          width: 'mapData(weight, 0, 200000, 2.5, 5)',
        },
      },
      {
        selector: 'edge.chain',
        style: {
          'line-color': open,
          'target-arrow-color': open,
          'line-style': 'solid',
          width: 'mapData(weight, 0, 200000, 2, 4.5)',
        },
      },
      {
        selector: 'edge.other',
        style: {
          'line-style': 'dashed',
          'target-arrow-shape': 'none',
          opacity: 0.55,
        },
      },
      {
        selector: 'edge.private',
        style: { opacity: 0.4 },
      },
    ];
  }
}
