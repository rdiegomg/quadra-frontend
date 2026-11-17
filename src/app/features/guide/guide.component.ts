import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../core/i18n';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-guide',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
  ],
  template: `
    <div class="page guide">
      @if (i18n.lang() === 'es') {
        <header class="guide-hero">
          <span class="eyebrow">Guía de QUADRA</span>
          <h1>Cancelamos deudas entre empresas<br />sin que circule dinero</h1>
          <p>
            QUADRA encuentra círculos y cadenas de deuda entre empresas y propone
            compensaciones multilaterales: cada empresa paga menos y cobra menos,
            y todos salen con liquidez sin mover un solo boliviano.
          </p>
        </header>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>problem</mat-icon> El problema que resolvemos</h2>
            <p>
              Tu empresa le debe a un proveedor… y ese proveedor le debe a otro…
              que a su vez te debe a ti. Nadie tiene efectivo para pagar, pero las
              deudas <em>ya están compensadas</em> — solo que nadie puede verlas
              juntas. QUADRA ve la red completa y encuentra esos círculos.
            </p>
            <div class="example">
              <strong>Ejemplo:</strong> la ferretería le debe a la constructora
              Bs 120.000, la constructora le debe a la distribuidora Bs 95.000 y la
              distribuidora le debe a la ferretería Bs 80.000. QUADRA detecta el
              círculo y propone cancelar Bs 80.000 de las tres deudas — la mínima
              del círculo — sin que nadie transfiera dinero.
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>route</mat-icon> Cómo funciona</h2>
            <div class="steps">
              <div class="step">
                <span class="step-num">1</span>
                <div>
                  <h3>Carga tus cuentas</h3>
                  <p>Registras tus cuentas por cobrar y por pagar (manual o por planilla CSV), con el NIT de cada contraparte y documentos de respaldo.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-num">2</span>
                <div>
                  <h3>El motor arma la red</h3>
                  <p>QUADRA construye el mapa completo de deudas entre todas las empresas registradas y detecta círculos y cadenas compensables.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-num">3</span>
                <div>
                  <h3>Recibes tu propuesta</h3>
                  <p>Cada empresa ve solo lo suyo: cuánto se le cancela de deuda y cuánto deja de cobrar. Nadie ve los datos de nadie.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-num">4</span>
                <div>
                  <h3>Todos votan</h3>
                  <p>Cada empresa acepta o rechaza desde su cuenta. En la tarjeta ves el progreso en vivo ("4 de 6 aceptaron"). Solo si <strong>todas</strong> aceptan se ejecuta; una negativa deja la cadena fuera. Si los saldos del tramo cambian antes de cerrar, la propuesta caduca.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-num">5</span>
                <div>
                  <h3>Se ejecuta y se emite el acta</h3>
                  <p>Al completarse la aceptación, los saldos bajan de verdad en el momento (lo compensado se extingue, el residuo sigue vivo) y QUADRA emite el <strong>acta de compensación</strong> — descargable e imprimible, con todas las partes, tramos y montos. Todo incluido en la suscripción mensual, sin comisiones porcentuales.</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>menu_book</mat-icon> Conceptos clave</h2>
            <div class="glossary">
              <div class="term">
                <h3><span class="dot closed"></span> Cadena cerrada</h3>
                <p>Un círculo de deudas (A → B → C → A). Es el caso ideal: se puede cancelar el monto mínimo del círculo en todas las deudas a la vez. Estado "Lista para cerrar".</p>
              </div>
              <div class="term">
                <h3><span class="dot open"></span> Cadena abierta</h3>
                <p>Una fila de deudas que no cierra el círculo (A → B → C). Igual se compensa en parte: el primero paga menos y el último cobra menos.</p>
              </div>
              <div class="term">
                <h3><mat-icon>link</mat-icon> Eslabón</h3>
                <p>Cada deuda individual dentro de una cadena. Si falta un eslabón (el "?" del mapa), la cadena no cierra — por eso conviene invitar a más empresas a la red.</p>
              </div>
              <div class="term">
                <h3><mat-icon>tips_and_updates</mat-icon> Oportunidad</h3>
                <p>Si sos la primera o última punta de una cadena abierta, QUADRA te muestra qué deuda faltante cerraría el círculo ("si le debés a X" o "si X te debe"). Al registrarla, el círculo aparece solo y se puede compensar más deuda.</p>
              </div>
              <div class="term">
                <h3><mat-icon>description</mat-icon> Acta de compensación</h3>
                <p>El documento que formaliza el acuerdo cuando todas las empresas aceptaron: número de acta, fecha, partes con NIT, tramos compensados y saldos residuales. Se descarga desde la cadena compensada.</p>
              </div>
              <div class="term">
                <h3><mat-icon>savings</mat-icon> Monto compensable</h3>
                <p>El mínimo de las deudas de la cadena: lo máximo que se puede cancelar sin afectar la posición neta de los intermediarios.</p>
              </div>
              <div class="term">
                <h3><mat-icon>card_membership</mat-icon> Suscripción</h3>
                <p>El acceso es por suscripción mensual fija: sin comisiones porcentuales ni costos escondidos. Todo lo que se compensa es ahorro tuyo.</p>
              </div>
              <div class="term">
                <h3><mat-icon>lock</mat-icon> Identidad protegida</h3>
                <p>Las empresas que no son tu contraparte directa aparecen anonimizadas ("Empresa de Transporte") y sus montos como "Monto privado".</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>travel_explore</mat-icon> Recorrido por la plataforma</h2>
            <div class="tour">
              <div class="stop">
                <mat-icon>dashboard</mat-icon>
                <div>
                  <h3>Mi empresa</h3>
                  <p>Tu ficha con KPIs (por cobrar, por pagar, posición neta, compensable), <strong>"Tus cadenas"</strong> con el anillo de cada propuesta y sus votos en vivo, y la sección <strong>"Oportunidades"</strong>: los eslabones faltantes que cerrarían círculos contigo como punta. Al compensarse una cadena, queda visible con su acta.</p>
                </div>
              </div>
              <div class="stop">
                <mat-icon>receipt_long</mat-icon>
                <div>
                  <h3>Obligaciones</h3>
                  <p>Tus cuentas por cobrar y por pagar: registro individual o masivo por planilla CSV, con N° de factura, periodicidad, calendario de cuotas y vencimientos relativos ("Vence en 12 días"). También marcas pagadas o anulas.</p>
                </div>
              </div>
              <div class="stop">
                <mat-icon>attach_file</mat-icon>
                <div>
                  <h3>Documentos</h3>
                  <p>Adjunta contratos y facturas a cada obligación para respaldar que la deuda es real@if (demoMode) { (simulado en la demo) }.</p>
                </div>
              </div>
              <div class="stop">
                <mat-icon>hub</mat-icon>
                <div>
                  <h3>Mi red</h3>
                  <p>El mapa de tu entorno: tu empresa al centro, tus contrapartes con nombre y el resto anonimizado. Las aristas de cadenas cerradas, abiertas y demás obligaciones se distinguen por color.</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>privacy_tip</mat-icon> Privacidad por diseño</h2>
            <ul class="privacy-list">
              <li>Solo ves tus propias cuentas y las cadenas donde participas.</li>
              <li>Las contrapartes directas aparecen con nombre; el resto de la red se anonimiza por rubro.</li>
              <li>Los montos de tramos ajenos siempre dicen "Monto privado".</li>
              <li>El administrador ve la red completa para detectar cadenas, pero la propuesta que recibe cada empresa solo contiene su información.</li>
            </ul>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>quiz</mat-icon> Preguntas frecuentes</h2>
            <mat-accordion>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>¿Cómo se paga QUADRA?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>Por suscripción mensual fija, sin comisiones porcentuales ni intereses. Cargar obligaciones, recibir propuestas y votar están incluidos — todo lo que se compensa es ahorro tuyo.</p>
              </mat-expansion-panel>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>¿Qué pasa si una empresa de la cadena no acepta?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>La propuesta queda rechazada y la cadena no se ejecuta — la compensación es voluntaria y requiere el acuerdo de todos. Y si los saldos del tramo cambian mientras se vota (alguien pagó, por ejemplo), la propuesta caduca en vez de ejecutarse sobre deudas que ya no existen.</p>
              </mat-expansion-panel>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>¿Qué es una "oportunidad"?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>Cuando sos la punta de una cadena abierta, QUADRA te dice qué deuda cerraría el círculo: "si le debés a esta empresa" o "si esta empresa te debe". Si esa deuda existe en la realidad — vos ya conocés a esa contraparte — la registrás y el círculo se cierra solo, desbloqueando la compensación para toda la cadena.</p>
              </mat-expansion-panel>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>¿Qué pasa con la deuda que queda sin compensar?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>Sigue vigente con sus condiciones originales. Solo se extingue la parte compensada (el "queda X" que ves en cada eslabón).</p>
              </mat-expansion-panel>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>¿Las otras empresas pueden ver mis deudas?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>No. Cada empresa solo ve montos de los tramos donde participa directamente. El resto aparece como "Monto privado" y las empresas no relacionadas, anonimizadas.</p>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-card-content>
        </mat-card>

        @if (demoMode) {
          <p class="demo-note">
            <mat-icon>science</mat-icon>
            Demo con datos ficticios: las empresas y deudas son simuladas y las demás
            empresas aceptan automáticamente para poder mostrar el flujo completo.
            El resto es real: tu decisión, la ejecución sobre saldos y el acta.
          </p>
        }
      } @else {
        <header class="guide-hero">
          <span class="eyebrow">QUADRA Guide</span>
          <h1>We cancel debts between companies<br />without moving money</h1>
          <p>
            QUADRA finds debt circles and chains between companies and proposes
            multilateral compensations: each company pays less and collects less,
            and everyone ends up with liquidity without moving a single boliviano.
          </p>
        </header>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>problem</mat-icon> The problem we solve</h2>
            <p>
              Your company owes a supplier… and that supplier owes another… which
              in turn owes you. Nobody has cash to pay, but the debts
              <em>are already compensated</em> — it's just that nobody can see
              them together. QUADRA sees the full network and finds those circles.
            </p>
            <div class="example">
              <strong>Example:</strong> the hardware store owes the construction
              company Bs 120,000, the construction company owes the distributor
              Bs 95,000 and the distributor owes the hardware store Bs 80,000.
              QUADRA detects the circle and proposes cancelling Bs 80,000 of all
              three debts — the circle's minimum — without anyone transferring money.
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>route</mat-icon> How it works</h2>
            <div class="steps">
              <div class="step">
                <span class="step-num">1</span>
                <div>
                  <h3>Upload your accounts</h3>
                  <p>You register your receivables and payables (manually or via CSV spreadsheet), with each counterparty's tax ID and supporting documents.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-num">2</span>
                <div>
                  <h3>The engine builds the network</h3>
                  <p>QUADRA builds the complete map of debts between all registered companies and detects circles and compensable chains.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-num">3</span>
                <div>
                  <h3>You get your proposal</h3>
                  <p>Each company only sees its own: how much debt gets cancelled and how much it stops collecting. Nobody sees anyone else's data.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-num">4</span>
                <div>
                  <h3>Everyone votes</h3>
                  <p>Each company accepts or rejects from its own account. The card shows live progress ("4 of 6 accepted"). The chain only executes if <strong>everyone</strong> accepts; a rejection leaves it out. If the tranche's balances change before closing, the proposal expires.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-num">5</span>
                <div>
                  <h3>It executes and the deed is issued</h3>
                  <p>Once acceptance is complete, balances drop for real right away (the compensated part is extinguished, the residual stays alive) and QUADRA issues the <strong>compensation deed</strong> — downloadable and printable, with all parties, tranches and amounts. All included in the monthly subscription — no percentage fees.</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>menu_book</mat-icon> Key concepts</h2>
            <div class="glossary">
              <div class="term">
                <h3><span class="dot closed"></span> Closed chain</h3>
                <p>A circle of debts (A → B → C → A). The ideal case: the circle's minimum amount can be cancelled across all debts at once. Status "Ready to close".</p>
              </div>
              <div class="term">
                <h3><span class="dot open"></span> Open chain</h3>
                <p>A row of debts that doesn't close the circle (A → B → C). It still partially compensates: the first pays less and the last collects less.</p>
              </div>
              <div class="term">
                <h3><mat-icon>link</mat-icon> Link</h3>
                <p>Each individual debt inside a chain. If a link is missing (the "?" on the map), the chain doesn't close — that's why inviting more companies to the network pays off.</p>
              </div>
              <div class="term">
                <h3><mat-icon>tips_and_updates</mat-icon> Opportunity</h3>
                <p>If you're the first or last endpoint of an open chain, QUADRA shows you which missing debt would close the circle ("if you owe X" or "if X owes you"). Register it and the circle appears on its own, unlocking more compensation.</p>
              </div>
              <div class="term">
                <h3><mat-icon>description</mat-icon> Compensation deed</h3>
                <p>The document formalizing the agreement once all companies accepted: deed number, date, parties with tax IDs, compensated tranches and residual balances. Downloadable from the compensated chain.</p>
              </div>
              <div class="term">
                <h3><mat-icon>savings</mat-icon> Compensable amount</h3>
                <p>The minimum of the chain's debts: the most that can be cancelled without affecting the intermediaries' net position.</p>
              </div>
              <div class="term">
                <h3><mat-icon>card_membership</mat-icon> Subscription</h3>
                <p>Access is a fixed monthly subscription: no percentage fees, no hidden costs. Whatever gets compensated is savings you keep.</p>
              </div>
              <div class="term">
                <h3><mat-icon>lock</mat-icon> Protected identity</h3>
                <p>Companies that are not your direct counterparty appear anonymized ("Transport company") and their amounts as "Private amount".</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>travel_explore</mat-icon> Platform tour</h2>
            <div class="tour">
              <div class="stop">
                <mat-icon>dashboard</mat-icon>
                <div>
                  <h3>My company</h3>
                  <p>Your profile card with KPIs (receivable, payable, net position, compensable), <strong>"Your chains"</strong> with each proposal's ring and live votes, and the <strong>"Opportunities"</strong> section: the missing links that would close circles with you as an endpoint. A compensated chain stays visible with its deed.</p>
                </div>
              </div>
              <div class="stop">
                <mat-icon>receipt_long</mat-icon>
                <div>
                  <h3>Obligations</h3>
                  <p>Your receivables and payables: individual entry or bulk CSV upload, with invoice number, frequency, installment calendar and relative due dates ("Due in 12 days"). You can also mark as paid or void them.</p>
                </div>
              </div>
              <div class="stop">
                <mat-icon>attach_file</mat-icon>
                <div>
                  <h3>Documents</h3>
                  <p>Attach contracts and invoices to each obligation to back up that the debt is real@if (demoMode) { (simulated in the demo) }.</p>
                </div>
              </div>
              <div class="stop">
                <mat-icon>hub</mat-icon>
                <div>
                  <h3>My network</h3>
                  <p>The map of your environment: your company at the center, your counterparties named and the rest anonymized. Closed-chain, open-chain and other obligation edges are color-coded.</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>privacy_tip</mat-icon> Privacy by design</h2>
            <ul class="privacy-list">
              <li>You only see your own accounts and the chains you participate in.</li>
              <li>Direct counterparties appear by name; the rest of the network is anonymized by sector.</li>
              <li>Amounts of links that aren't yours always read "Private amount".</li>
              <li>The administrator sees the full network to detect chains, but the proposal each company receives only contains its own information.</li>
            </ul>
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-content>
            <h2><mat-icon>quiz</mat-icon> Frequently asked questions</h2>
            <mat-accordion>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>How is QUADRA paid?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>Through a fixed monthly subscription — no percentage fees, no interest. Uploading obligations, receiving proposals and voting are all included; whatever gets compensated is savings you keep.</p>
              </mat-expansion-panel>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>What if a company in the chain doesn't accept?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>The proposal is rejected and the chain doesn't execute — compensation is voluntary and needs everyone's agreement. And if the tranche's balances change while voting (someone paid, for example), the proposal expires instead of executing on debts that no longer exist.</p>
              </mat-expansion-panel>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>What is an "opportunity"?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>When you're an endpoint of an open chain, QUADRA tells you which debt would close the circle: "if you owe this company" or "if this company owes you". If that debt exists in reality — you already know that counterparty — you register it and the circle closes by itself, unlocking compensation for the whole chain.</p>
              </mat-expansion-panel>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>What happens to the debt left uncompensated?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>It remains in force under its original terms. Only the compensated part is extinguished (the "remaining X" you see on each link).</p>
              </mat-expansion-panel>
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>Can other companies see my debts?</mat-panel-title>
                </mat-expansion-panel-header>
                <p>No. Each company only sees amounts for the links it directly participates in. The rest shows as "Private amount" and unrelated companies are anonymized.</p>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-card-content>
        </mat-card>

        @if (demoMode) {
          <p class="demo-note">
            <mat-icon>science</mat-icon>
            Demo with fictional data: companies and debts are simulated and the
            other companies auto-accept so the full flow can be shown. The rest is
            real: your decision, the balance execution and the deed.
          </p>
        }
      }
    </div>
  `,
  styleUrl: './guide.component.css',
})
export class GuideComponent {
  protected readonly i18n = inject(I18nService);
  readonly demoMode = environment.demoMode;
}
