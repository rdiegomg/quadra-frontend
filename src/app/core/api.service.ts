import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Chain,
  Company,
  CompanySummary,
  CompensationProposal,
  Cycle,
  ImportResult,
  MyChain,
  MyNetwork,
  NetworkGraph,
  NetworkStatistics,
  Obligation,
  ObligationCreate,
  ObligationEvent,
  ObligationStatus,
  PaymentScheduleItem,
  Sector,
  SimulationResult,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getSectors(): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${this.api}/sectors`);
  }

  getMyCompany(): Observable<Company> {
    return this.http.get<Company>(`${this.api}/companies/me`);
  }

  getMySummary(): Observable<CompanySummary> {
    return this.http.get<CompanySummary>(`${this.api}/companies/me/summary`);
  }

  getMyProposal(): Observable<CompensationProposal | null> {
    return this.http.get<CompensationProposal | null>(
      `${this.api}/companies/me/proposal`,
    );
  }

  getMyChains(): Observable<MyChain[]> {
    return this.http.get<MyChain[]>(`${this.api}/companies/me/chains`);
  }

  getMyNetwork(): Observable<MyNetwork> {
    return this.http.get<MyNetwork>(`${this.api}/companies/me/network`);
  }

  importObligationsCsv(file: File): Observable<ImportResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImportResult>(`${this.api}/obligations/import`, form);
  }

  getObligations(view: 'receivable' | 'payable', status?: ObligationStatus): Observable<Obligation[]> {
    let params = new HttpParams();
    if (status) params = params.set('status_filter', status);
    return this.http.get<Obligation[]>(`${this.api}/obligations/${view}`, { params });
  }

  createObligation(payload: ObligationCreate): Observable<Obligation> {
    return this.http.post<Obligation>(`${this.api}/obligations`, payload);
  }

  updateStatus(id: number, status: ObligationStatus): Observable<Obligation> {
    return this.http.patch<Obligation>(`${this.api}/obligations/${id}/status`, { status });
  }

  getObligationEvents(id: number): Observable<ObligationEvent[]> {
    return this.http.get<ObligationEvent[]>(`${this.api}/obligations/${id}/events`);
  }

  getSchedules(obligationId: number): Observable<PaymentScheduleItem[]> {
    return this.http.get<PaymentScheduleItem[]>(
      `${this.api}/obligations/${obligationId}/schedules`,
    );
  }

  uploadDocument(obligationId: number, file: File): Observable<unknown> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.api}/obligations/${obligationId}/documents`, form);
  }

  // --- Admin ---

  getAdminCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.api}/admin/companies`);
  }

  getAdminObligations(status?: ObligationStatus): Observable<Obligation[]> {
    let params = new HttpParams();
    if (status) params = params.set('status_filter', status);
    return this.http.get<Obligation[]>(`${this.api}/admin/obligations`, { params });
  }

  getNetworkGraph(): Observable<NetworkGraph> {
    return this.http.get<NetworkGraph>(`${this.api}/admin/network`);
  }

  getNetworkStatistics(): Observable<NetworkStatistics> {
    return this.http.get<NetworkStatistics>(`${this.api}/admin/network/statistics`);
  }

  getCycles(): Observable<Cycle[]> {
    return this.http.get<Cycle[]>(`${this.api}/admin/network/cycles`);
  }

  getOpenChains(): Observable<Chain[]> {
    return this.http.get<Chain[]>(`${this.api}/admin/network/open-chains`);
  }

  runSimulation(): Observable<SimulationResult> {
    return this.http.get<SimulationResult>(`${this.api}/admin/network/simulation`);
  }
}
