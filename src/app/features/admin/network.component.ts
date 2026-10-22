import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import cytoscape, { Core, NodeSingular, StylesheetJson } from 'cytoscape';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { TranslatePipe } from '../../core/i18n';
import { ThemeService } from '../../core/theme.service';
import { Cycle, NetworkGraph } from '../../core/models';

interface NodeDetail {
  name: string;
  nit: string;
  sector: string | null;
  receivable: number;
  payable: number;
}

@Component({
  selector: 'app-network',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatIconModule, TranslatePipe],
  templateUrl: './network.component.html',
  styleUrl: './network.component.css',
})
export class NetworkComponent implements AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);

  @ViewChild('graphCanvas') private graphCanvas!: ElementRef<HTMLDivElement>;

  private cy: Core | null = null;
  private readonly viewReady = signal(false);
  private readonly graph = signal<NetworkGraph | null>(null);

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly cycles = signal<Cycle[]>([]);
  readonly onlyCycles = signal(false);
  readonly selectedCycleIndex = signal<number | null>(null);
  readonly selectedNode = signal<NodeDetail | null>(null);

  constructor() {
    forkJoin({
      graph: this.api.getNetworkGraph(),
      cycles: this.api.getCycles(),
    }).subscribe({
      next: ({ graph, cycles }) => {
        this.graph.set(graph);
        this.cycles.set(cycles);
        this.loading.set(false);
      },
      error: () => this.loadError.set(true),
    });

    effect(() => {
      const g = this.graph();
      if (g && this.viewReady()) this.renderGraph(g);
    });
    effect(() => {
      const dark = this.theme.isDark();
      this.cy?.style(this.stylesheet(dark));
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
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

  toggleOnlyCycles(): void {
    if (!this.cy) return;
    const only = !this.onlyCycles();
    this.onlyCycles.set(only);
    const cycleEdgeIds = new Set(
      this.cycles().flatMap((c) => c.edges.map((e) => `${e.debtor_id}-${e.creditor_id}`)),
    );
    this.cy.batch(() => {
      this.cy!.nodes().forEach((n) => {
        n.style('display', only && !n.data('in_cycle') ? 'none' : 'element');
      });
      this.cy!.edges().forEach((e) => {
        e.style('display', only && !cycleEdgeIds.has(e.id()) ? 'none' : 'element');
      });
    });
    this.cy.fit(undefined, 40);
  }

  selectCycle(index: number): void {
    if (!this.cy) return;
    if (this.selectedCycleIndex() === index) {
      this.clearHighlight();
      return;
    }
    this.selectedCycleIndex.set(index);
    const cycle = this.cycles()[index];
    const nodeIds = new Set(cycle.company_ids.map(String));
    const edgeIds = new Set(cycle.edges.map((e) => `${e.debtor_id}-${e.creditor_id}`));
    this.cy.elements().removeClass('hl faded');
    this.cy.nodes().forEach((n) => {
      n.addClass(nodeIds.has(n.id()) ? 'hl' : 'faded');
    });
    this.cy.edges().forEach((e) => {
      e.addClass(edgeIds.has(e.id()) ? 'hl' : 'faded');
    });
  }

  clearHighlight(): void {
    this.selectedCycleIndex.set(null);
    this.cy?.elements().removeClass('hl faded');
  }

  closeNodeDetail(): void {
    this.selectedNode.set(null);
  }

  private renderGraph(graph: NetworkGraph): void {
    const elements = [
      ...graph.nodes.map((n) => ({
        data: n.data,
        classes: n.data.in_cycle ? 'in-cycle' : '',
      })),
      ...graph.edges.map((e) => ({
        data: { ...e.data, balance: Number(e.data.balance) },
      })),
    ];

    this.cy = cytoscape({
      container: this.graphCanvas.nativeElement,
      elements,
      style: this.stylesheet(this.theme.isDark()),
      layout: this.layoutOptions(false),
      wheelSensitivity: 0.15,
      minZoom: 0.1,
      maxZoom: 3,
    });

    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      let receivable = 0;
      let payable = 0;
      node.incomers('edge').forEach((e) => {
        receivable += Number(e.data('balance'));
      });
      node.outgoers('edge').forEach((e) => {
        payable += Number(e.data('balance'));
      });
      this.selectedNode.set({
        name: node.data('label'),
        nit: node.data('nit'),
        sector: node.data('sector'),
        receivable,
        payable,
      });
    });
    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) this.selectedNode.set(null);
    });
  }

  private layoutOptions(animate: boolean) {
    return {
      name: 'cose',
      animate,
      animationDuration: 600,
      nodeRepulsion: () => 9000,
      idealEdgeLength: () => 90,
      componentSpacing: 70,
      padding: 30,
    } as cytoscape.LayoutOptions;
  }

  private stylesheet(dark: boolean): StylesheetJson {
    const textColor = dark ? '#e6e9f2' : '#2a2f3d';
    const labelBg = dark ? 'rgba(27,30,41,0.75)' : 'rgba(255,255,255,0.75)';
    const edgeColor = dark ? '#4d566d' : '#c3c9d8';
    return [
      {
        selector: '.faded',
        style: { opacity: 0.12, 'text-opacity': 0 },
      },
      {
        selector: 'node',
        style: {
          'background-color': dark ? '#8fa2c7' : '#5f6b85',
          label: 'data(label)',
          'font-size': 8,
          color: textColor,
          'text-valign': 'bottom',
          'text-margin-y': 4,
          'text-wrap': 'ellipsis',
          'text-max-width': '80px',
          'text-background-color': labelBg,
          'text-background-opacity': 1,
          'text-background-padding': '2px',
          'text-background-shape': 'roundrectangle',
          width: 16,
          height: 16,
        },
      },
      {
        selector: 'node.in-cycle',
        style: { 'background-color': '#b5653f', width: 19, height: 19 },
      },
      {
        selector: 'node.hl',
        style: { 'background-color': '#e07b39', width: 24, height: 24, opacity: 1, 'text-opacity': 1 },
      },
      {
        selector: 'edge',
        style: {
          width: 'mapData(balance, 0, 150000, 1, 6)',
          'line-color': edgeColor,
          'target-arrow-color': edgeColor,
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.8,
          'curve-style': 'bezier',
          opacity: 0.75,
        },
      },
      {
        selector: 'edge.hl',
        style: {
          'line-color': '#e07b39',
          'target-arrow-color': '#e07b39',
          'arrow-scale': 1.2,
          opacity: 1,
          'z-index': 10,
        },
      },
    ];
  }
}
