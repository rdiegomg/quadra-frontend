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
import { ApiService } from '../../core/api.service';
import { ThemeService } from '../../core/theme.service';
import { MyNetwork, MyNetworkNode } from '../../core/models';

interface SelectedInfo {
  label: string;
  sector: string | null;
  anonymous: boolean;
  isMe: boolean;
}

@Component({
  selector: 'app-my-network',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
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

  readonly anonymousCount = signal(0);

  constructor() {
    this.api.getMyNetwork().subscribe({
      next: (g) => {
        this.graph.set(g);
        this.anonymousCount.set(g.nodes.filter((n) => n.anonymous).length);
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

  private renderGraph(
    graph: MyNetwork,
    canvas: ElementRef<HTMLDivElement>,
  ): void {
    const elements = [
      ...graph.nodes.map((n: MyNetworkNode) => ({
        data: { ...n, balance: 0 },
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
          weight: e.balance ? Math.min(Number(e.balance), 150000) : 0,
          label:
            e.balance !== null
              ? `Bs ${Number(e.balance).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`
              : '',
        },
        classes: e.balance === null ? 'private' : '',
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

  private layoutOptions(animate: boolean) {
    return {
      name: 'cose',
      animate,
      animationDuration: 600,
      nodeRepulsion: () => 9000,
      idealEdgeLength: () => 100,
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
        selector: 'node',
        style: {
          'background-color': dark ? '#8fa2c7' : '#5f6b85',
          label: 'data(label)',
          'font-size': 9,
          color: textColor,
          'text-valign': 'bottom',
          'text-margin-y': 4,
          'text-wrap': 'ellipsis',
          'text-max-width': '90px',
          'text-background-color': labelBg,
          'text-background-opacity': 1,
          'text-background-padding': '2px',
          'text-background-shape': 'roundrectangle',
          width: 18,
          height: 18,
        },
      },
      {
        selector: 'node.me',
        style: {
          'background-color': '#b5653f',
          width: 30,
          height: 30,
          'font-size': 10,
          'font-weight': 'bold',
        },
      },
      {
        selector: 'node.anonymous',
        style: {
          'background-color': dark ? '#3d465c' : '#c3c9d8',
          'border-width': 1,
          'border-color': dark ? '#5f6b85' : '#9aa3b8',
          'border-style': 'dashed',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 'mapData(weight, 0, 150000, 1, 5)',
          'line-color': edgeColor,
          'target-arrow-color': edgeColor,
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.8,
          'curve-style': 'bezier',
          opacity: 0.8,
          label: 'data(label)',
          'font-size': 8,
          'text-rotation': 'autorotate',
          'text-background-color': labelBg,
          'text-background-opacity': 1,
          'text-background-padding': '1px',
          color: textColor,
        },
      },
      {
        selector: 'edge.private',
        style: { 'line-style': 'dashed', opacity: 0.35 },
      },
    ];
  }
}
