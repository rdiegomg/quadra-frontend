import { Component, computed, inject, input } from '@angular/core';
import { ThemeService } from '../../core/theme.service';
import { MyChain } from '../../core/models';

interface RingNode {
  x: number;
  y: number;
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  dashed: boolean;
  initials: string;
  lock: boolean;
  ghost: boolean;
  label: string;
  sub: string;
  lx: number;
  ly: number;
  anchor: 'start' | 'middle' | 'end';
  nameY: number;
  subY: number;
}

interface RingArc {
  d: string;
  cls: 'mine' | 'priv' | 'ghost';
  stroke: string;
  chevron?: { x: number; y: number; rot: number };
  pill?: { x: number; y: number; w: number; text: string; privateText: boolean };
}

interface RingView {
  w: number;
  h: number;
  nodes: RingNode[];
  arcs: RingArc[];
}

@Component({
  selector: 'app-chain-ring',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + vm().w + ' ' + vm().h" class="ring" role="img">
      @for (a of vm().arcs; track $index) {
        <path [attr.d]="a.d" fill="none" [attr.stroke]="a.stroke"
          [attr.stroke-width]="a.cls === 'ghost' ? 3 : 15"
          stroke-linecap="round"
          [attr.stroke-dasharray]="a.cls === 'ghost' ? '7 7' : null" />
        @if (a.chevron; as cv) {
          <path d="M -3 -8 L 5 0 L -3 8" fill="none" [attr.stroke]="chevColor()"
            stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
            [attr.transform]="'translate(' + cv.x + ' ' + cv.y + ') rotate(' + cv.rot + ')'" />
        }
        @if (a.pill; as p) {
          <g [attr.transform]="'translate(' + p.x + ' ' + p.y + ')'">
            <rect [attr.x]="-p.w / 2" y="-11" [attr.width]="p.w" height="22" rx="11"
              [attr.fill]="pillBg()" [attr.stroke]="pillBorder()" />
            <text text-anchor="middle" dy="3.5" font-size="10"
              [attr.font-weight]="p.privateText ? 500 : 700"
              [attr.font-style]="p.privateText ? 'italic' : 'normal'"
              [attr.fill]="p.privateText ? subColor() : inkColor()">{{ p.text }}</text>
          </g>
        }
      }
      @for (n of vm().nodes; track $index) {
        <circle [attr.cx]="n.x" [attr.cy]="n.y" [attr.r]="n.r"
          [attr.fill]="n.fill" [attr.stroke]="n.stroke" [attr.stroke-width]="n.strokeWidth"
          [attr.stroke-dasharray]="n.dashed ? '5 5' : null" />
        @if (n.ghost) {
          <text [attr.x]="n.x" [attr.y]="n.y + 6" text-anchor="middle" font-size="17"
            font-weight="700" [attr.fill]="subColor()">?</text>
        }
        @if (n.initials) {
          <text [attr.x]="n.x" [attr.y]="n.y + 6" text-anchor="middle" font-size="16"
            font-weight="700" fill="#fff">{{ n.initials }}</text>
        }
        @if (n.lock) {
          <g [attr.transform]="'translate(' + (n.x - 10) + ' ' + (n.y - 10) + ') scale(0.84)'">
            <rect x="5" y="10.5" width="14" height="9.5" rx="2" fill="none"
              [attr.stroke]="lockColor()" stroke-width="2.2" />
            <path d="M8 10.5V7.5a4 4 0 018 0v3" fill="none"
              [attr.stroke]="lockColor()" stroke-width="2.2" />
          </g>
        }
        @if (n.label) {
          <text [attr.x]="n.lx" [attr.y]="n.ly + n.nameY" [attr.text-anchor]="n.anchor"
            font-size="11.5" font-weight="700" [attr.fill]="inkColor()">{{ n.label }}</text>
          <text [attr.x]="n.lx" [attr.y]="n.ly + n.subY" [attr.text-anchor]="n.anchor"
            font-size="9.5" [attr.fill]="subColor()">{{ n.sub }}</text>
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ring {
        display: block;
        width: 100%;
        height: auto;
      }
    `,
  ],
})
export class ChainRingComponent {
  readonly chain = input.required<MyChain>();
  readonly sectors = input<Map<string, string>>(new Map());

  private readonly theme = inject(ThemeService);

  protected readonly inkColor = computed(() =>
    this.theme.isDark() ? '#e6e9f2' : '#23293a',
  );
  protected readonly subColor = computed(() =>
    this.theme.isDark() ? '#9aa3b8' : '#6b7280',
  );
  protected readonly pillBg = computed(() => (this.theme.isDark() ? '#23293a' : '#ffffff'));
  protected readonly pillBorder = computed(() =>
    this.theme.isDark() ? '#3d465c' : '#e3e6ee',
  );
  protected readonly chevColor = computed(() => '#f5f0ea');
  protected readonly lockColor = computed(() =>
    this.theme.isDark() ? '#8fa2c7' : '#9aa3b8',
  );

  protected readonly vm = computed<RingView>(() => this.build());

  private build(): RingView {
    const chain = this.chain();
    const isCycle = chain.kind === 'cycle';
    const n = chain.labels.length;
    const dark = this.theme.isDark();

    // posicion de "yo" dentro del orden de la cadena
    let meIdx = chain.edges.findIndex((e) => e.debtor_is_me);
    if (meIdx === -1) meIdx = chain.edges.findIndex((e) => e.creditor_is_me) + 1;

    // ciclos: roto para quedar arriba; abiertas: orden natural + nodo fantasma
    const order = isCycle
      ? [...Array(n).keys()].map((k) => (k + meIdx) % n)
      : [...Array(n).keys()];
    const edges = isCycle
      ? [...chain.edges.slice(meIdx), ...chain.edges.slice(0, meIdx)]
      : chain.edges;
    const total = isCycle ? n : n + 1;

    // geometria: margenes suficientes para las etiquetas exteriores
    const ringR = Math.max(104, 24 * total);
    const cx = ringR + 198;
    const cy = ringR + 96;
    const w = cx * 2;
    const h = cy + ringR + 100;

    const deg2rad = (d: number) => (d * Math.PI) / 180;
    const nodeAngle = (pos: number) => -90 + (360 / total) * pos;
    const pointAt = (deg: number, rad: number) => ({
      x: cx + rad * Math.cos(deg2rad(deg)),
      y: cy + rad * Math.sin(deg2rad(deg)),
    });

    const meFill = '#23293a';
    const cpFill = '#b5653f';
    const meStroke = '#cf8a63';
    const anonFill = dark ? '#23293a' : '#ffffff';
    const anonStroke = dark ? '#5f6b85' : '#c3c9d8';
    const ghostStroke = dark ? '#5f6b85' : '#b9bfcc';

    const nodes: RingNode[] = order.map((idx, pos) => {
      const label = chain.labels[idx];
      const anonymous = label.startsWith('Empresa de ');
      const isMe = idx === meIdx;
      const ang = nodeAngle(pos);
      const rad = isMe ? 34 : 31;
      const p = pointAt(ang, ringR);
      const sub = isMe
        ? 'Tú'
        : anonymous
          ? 'Identidad protegida'
          : (this.sectors().get(label) ?? 'Contraparte');

      // etiqueta radial hacia afuera
      const cos = Math.cos(deg2rad(ang));
      const sin = Math.sin(deg2rad(ang));
      const lp = pointAt(ang, ringR + rad + 20);
      let anchor: RingNode['anchor'] = 'middle';
      let nameY = 0;
      let subY = 14;
      if (cos > 0.45) {
        anchor = 'start';
        nameY = -2;
        subY = 12;
      } else if (cos < -0.45) {
        anchor = 'end';
        nameY = -2;
        subY = 12;
      } else if (sin < -0.3) {
        nameY = -16;
        subY = -2;
      }
      return {
        x: p.x,
        y: p.y,
        r: rad,
        fill: anonymous ? anonFill : isMe ? meFill : cpFill,
        stroke: isMe ? meStroke : anonymous ? anonStroke : '#f5f0ea',
        strokeWidth: isMe ? 5 : anonymous ? 1.5 : 0,
        dashed: false,
        initials: anonymous ? '' : this.initialsOf(label),
        lock: anonymous,
        ghost: false,
        label,
        sub,
        lx: lp.x,
        ly: lp.y,
        anchor,
        nameY,
        subY,
      };
    });

    if (!isCycle) {
      const p = pointAt(nodeAngle(n), ringR);
      nodes.push({
        x: p.x,
        y: p.y,
        r: 24,
        fill: 'transparent',
        stroke: ghostStroke,
        strokeWidth: 2,
        dashed: true,
        initials: '',
        lock: false,
        ghost: true,
        label: '',
        sub: '',
        lx: 0,
        ly: 0,
        anchor: 'middle',
        nameY: 0,
        subY: 0,
      });
    }

    // arcos entre posiciones consecutivas, con gap angular alrededor de cada nodo
    const gapFor = (pos: number) => (((pos < n ? nodes[pos].r : 24) + 13) / ringR) * (180 / Math.PI);

    const mineStroke = dark ? '#8fa2c7' : '#23293a';
    const privStroke = '#b5653f';
    const arcs: RingArc[] = [];

    const addArc = (from: number, to: number, label: string, cls: RingArc['cls']) => {
      const a1 = nodeAngle(from) + gapFor(from);
      let a2 = nodeAngle(to) - gapFor(to);
      while (a2 < a1) a2 += 360; // wrap del ultimo arco del ciclo
      const p1 = pointAt(a1, ringR);
      const p2 = pointAt(a2, ringR);
      const am = (a1 + a2) / 2;
      const cm = pointAt(am, ringR);
      const ap = a1 + 0.35 * (a2 - a1);
      const pp = pointAt(ap, ringR + 42);
      const pillW = label ? label.length * 6.4 + 20 : 0;
      arcs.push({
        d: `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${ringR} ${ringR} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
        cls,
        stroke: cls === 'mine' ? mineStroke : cls === 'priv' ? privStroke : ghostStroke,
        chevron: cls === 'ghost' ? undefined : { x: cm.x, y: cm.y, rot: am + 90 },
        pill: label
          ? { x: pp.x, y: pp.y, w: pillW, text: label, privateText: cls !== 'mine' }
          : undefined,
      });
    };

    edges.forEach((e, k) => {
      addArc(k, (k + 1) % total, e.balance !== null ? `Bs ${this.fmt(e.balance)}` : 'Monto privado',
        e.balance !== null ? 'mine' : 'priv');
    });
    if (!isCycle) {
      addArc(n - 1, n, '', 'ghost');
      addArc(n, 0, 'Falta este eslabón', 'ghost');
    }

    return { w, h, nodes, arcs };
  }

  private initialsOf(name: string): string {
    return name
      .replace(/\s+(S\.?A\.?|S\.?R\.?L\.?|S\.?C\.?A\.?|LTDA\.?|SRL|SA|SCA)$/i, '')
      .split(/\s+/)
      .filter((wd) => /^[A-Za-zÁÉÍÓÚÑ0-9]/.test(wd))
      .slice(0, 2)
      .map((wd) => wd[0].toUpperCase())
      .join('');
  }

  private fmt(v: string): string {
    return Number(v).toLocaleString('es-BO', { maximumFractionDigits: 0 });
  }
}
