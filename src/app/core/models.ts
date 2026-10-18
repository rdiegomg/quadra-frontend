export type UserRole = 'ADMIN' | 'COMPANY';
export type ObligationStatus =
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';
export type PaymentFrequency =
  | 'ONE_TIME'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'ANNUAL';
export type ObligationDirection = 'RECEIVABLE' | 'PAYABLE';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  company_id: number | null;
  company_name: string | null;
}

export interface Sector {
  id: number;
  name: string;
  description: string | null;
}

export interface Company {
  id: number;
  name: string;
  nit: string;
  legal_type: string;
  sector_id: number;
  sector_name: string | null;
}

export interface CompanySummary {
  company_id: number;
  total_receivable: string;
  total_payable: string;
  net_balance: string;
  pending_obligations: number;
  overdue_obligations: number;
}

export interface Counterparty {
  id: number;
  name: string;
  nit: string;
}

export interface Obligation {
  id: number;
  debtor: Counterparty;
  creditor: Counterparty;
  amount: string;
  balance: string;
  currency: string;
  reference: string | null;
  interest_rate: string | null;
  origin_date: string;
  due_date: string;
  payment_frequency: PaymentFrequency;
  status: ObligationStatus;
  in_chain: boolean;
  created_at: string;
}

export interface ObligationCreate {
  counterparty_nit: string;
  direction: ObligationDirection;
  amount: number;
  currency: string;
  reference?: string | null;
  interest_rate?: number | null;
  origin_date: string;
  due_date: string;
  payment_frequency: PaymentFrequency;
}

export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface PaymentScheduleItem {
  id: number;
  installment_number: number;
  due_date: string;
  amount: string;
  status: InstallmentStatus;
  paid_at: string | null;
}

export interface ObligationEvent {
  id: number;
  event_type: string;
  previous_status: ObligationStatus | null;
  new_status: ObligationStatus | null;
  created_at: string;
}

export interface CycleEdge {
  debtor_id: number;
  creditor_id: number;
  debtor_name: string;
  creditor_name: string;
  balance: string;
  obligation_ids: number[];
}

export interface Cycle {
  company_ids: number[];
  companies: string[];
  length: number;
  potential_compensation: string;
  total_volume: string;
  edges: CycleEdge[];
}

export interface Chain {
  company_ids: number[];
  companies: string[];
  length: number;
  total_volume: string;
  potential_compensation: string;
  ends_in_cycle: boolean;
  edges: { debtor_name: string; creditor_name: string; balance: string }[];
}

export interface TopCompany {
  company_id: number;
  company_name: string;
  amount: string;
}

export interface GraphNodeData {
  id: string;
  label: string;
  nit: string;
  sector: string | null;
  in_cycle: boolean;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  balance: string;
  count: number;
  obligation_ids: number[];
  currency: string;
}

export interface NetworkGraph {
  nodes: { data: GraphNodeData }[];
  edges: { data: GraphEdgeData }[];
}

export interface NetworkStatistics {
  companies_in_network: number;
  companies_total: number;
  open_connections: number;
  obligations_total: number;
  obligations_open: number;
  total_open_volume: string;
  companies_in_cycles: number;
  compensable_volume: string;
  compensation_rate: string;
  estimated_commission: string;
  cycles_in_estimate: number;
  chains_in_estimate: number;
  top_debtors: TopCompany[];
  top_creditors: TopCompany[];
  companies_by_sector: Record<string, number>;
}

export interface CompensationProposal {
  cycle_companies: string[];
  cycle_length: number;
  cancelled_amount: string;
  receivable_forgone: string;
  commission: string;
  est_financial_savings: string;
  currency: string;
}

export interface SimulationResult {
  cycles_used: number;
  chains_used: number;
  companies_participating: number;
  total_cancelled: string;
  estimated_commission: string;
  currency: string;
  note: string;
}

export interface MyChainEdge {
  debtor_label: string;
  creditor_label: string;
  debtor_is_me: boolean;
  creditor_is_me: boolean;
  balance: string | null;
  cancelled: string;
  remainder: string | null;
}

export interface MyChain {
  kind: 'cycle' | 'chain';
  labels: string[];
  named_participants: string[];
  anonymized_count: number;
  length: number;
  my_position: 'member' | 'source' | 'middle' | 'sink';
  cancelled_amount: string;
  receivable_forgone: string;
  potential_compensation: string;
  commission: string;
  status: 'ready' | 'compensable';
  first_due_date: string | null;
  edges: MyChainEdge[];
  currency: string;
}

export interface MyNetworkNode {
  id: string;
  label: string;
  sector: string | null;
  is_me: boolean;
  is_counterparty: boolean;
  anonymous: boolean;
}

export interface MyNetworkEdge {
  id: string;
  source: string;
  target: string;
  balance: string | null;
}

export interface MyNetwork {
  nodes: MyNetworkNode[];
  edges: MyNetworkEdge[];
}

export interface ImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
}
