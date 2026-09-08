export type UserRole = 'BEEKEEPER' | 'COLLECTOR' | 'PROCESSOR' | 'LAB' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface BatchItem {
  id: number;
  batch_id: string;
  source_type: string;
  source_reference?: string | null;
  quantity_kg: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BatchListResponse {
  items: BatchItem[];
  total: number;
  page: number;
  size: number;
}

export interface SupplyChainEvent {
  id: number;
  batch_id: string;
  event_type: string;
  location?: string | null;
  actor_id?: number | null;
  quantity_kg: number;
  timestamp: string;
  notes?: string | null;
  created_at: string;
}

export interface BatchTraceItem {
  event_type: string;
  quantity_kg: number;
  location?: string | null;
  timestamp: string;
  notes?: string | null;
}

export interface GenealogyNode {
  batch_id: string;
  source_type: string;
  quantity_kg: number;
  status: string;
  created_at: string;
}

export interface GenealogyLink {
  parent_batch_id: string;
  child_batch_id: string;
  relationship_type: string;
  quantity_transferred_kg: number;
  timestamp: string;
}

export interface GenealogyGraphResponse {
  batch_id: string;
  current_status: string;
  ancestors: GenealogyNode[];
  descendants: GenealogyNode[];
  links: GenealogyLink[];
  total_upstream_count: number;
  total_downstream_count: number;
}

export interface LabRecord {
  id: number;
  batch_id: string;
  test_name: string;
  test_result?: string | null;
  status: 'PENDING' | 'PASSED' | 'FAILED' | string;
  tested_at: string;
  laboratory_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface EvidenceRecord {
  id: number;
  batch_id: string;
  evidence_type: 'PHOTO' | 'DOCUMENT' | 'CERTIFICATE' | 'RECEIPT' | 'OTHER' | string;
  file_reference: string;
  description?: string | null;
  uploaded_by?: number | null;
  created_at: string;
}

export interface ReconciliationRecord {
  id?: number | null;
  batch_id: string;
  input_quantity_kg: number;
  output_quantity_kg: number;
  loss_quantity_kg: number;
  status: 'PASS' | 'WARNING' | 'ANOMALY';
  reason?: string | null;
  checked_at?: string | null;
}

export interface BatchDetailResponse extends BatchItem {
  events: SupplyChainEvent[];
  lab_records: LabRecord[];
  evidences: EvidenceRecord[];
  reconciliations: ReconciliationRecord[];
}

export interface BatchTraceResponse {
  batch_id: string;
  current_status: string;
  trace: BatchTraceItem[];
  genealogy?: GenealogyGraphResponse | null;
  lab_records: LabRecord[];
  evidence: EvidenceRecord[];
  reconciliations: ReconciliationRecord[];
  has_anomalies: boolean;
  blockchain_status?: string | null;
  blockchain_transaction_hash?: string | null;
  blockchain_anchored_at?: string | null;
}

export interface RuleCheckDetails {
  processing_vs_harvest: 'PASS' | 'FAIL';
  bottled_vs_processing: 'PASS' | 'FAIL';
  dispatched_vs_bottled: 'PASS' | 'FAIL';
}

export interface GapDetails {
  processing_gap_kg: number;
  bottling_gap_kg: number;
  dispatch_gap_kg: number;
}

export interface AnomalyCheckResponse {
  batch_id: string;
  rule_check: RuleCheckDetails;
  gaps: GapDetails;
  ml_prediction: 'NORMAL' | 'ANOMALY';
  final_status: 'NORMAL' | 'ANOMALY';
}

export interface QRVerificationResponse {
  batch_id: string;
  verification_url: string;
  qr_image_base64: string;
  is_active: boolean;
  created_at: string;
}

export interface BatchSummary {
  batch_id: string;
  source_type: string;
  quantity_kg: number;
  status: string;
  created_at: string;
}

export interface ConsumerVerificationResponse {
  verified: boolean;
  verification_message: string;
  batch: BatchSummary;
  trace: BatchTraceItem[];
  genealogy?: GenealogyGraphResponse | null;
  lab_records: LabRecord[];
  evidence: EvidenceRecord[];
  reconciliations: ReconciliationRecord[];
  has_anomalies: boolean;
  blockchain_status?: 'ANCHORED' | 'VERIFIED' | 'NOT_ANCHORED' | 'TAMPERED' | string;
  blockchain_transaction_hash?: string | null;
  blockchain_anchored_at?: string | null;
}

export interface BlockchainAnchorResponse {
  id: number;
  batch_id: string;
  record_type: string;
  canonical_hash: string;
  transaction_hash: string;
  block_number: number;
  network: string;
  provider: string;
  status: string;
  anchored_at: string;
}

export interface BlockchainVerificationResponse {
  batch_id: string;
  anchored_hash: string;
  current_hash: string;
  status: 'VERIFIED' | 'TAMPERED';
  tamper_detected: boolean;
  transaction_hash?: string | null;
  network?: string | null;
  checked_at: string;
}

export interface HoneyYieldResponse {
  prediction_type: string;
  predicted_yield_kg: number;
  model: string;
}

export interface DailyProductionResponse {
  prediction_type: string;
  predicted_production_kg: number;
  model: string;
}

export interface VoiceTranscriptionResponse {
  transcript: string;
  language: string;
  confidence: number;
  provider: string;
}

export interface VoiceQueryResponse {
  transcript: string;
  intent: string;
  batch_id?: string | null;
  message: string;
  data?: any;
  provider?: string | null;
}

export interface AnalyticsOverviewResponse {
  total_users: number;
  total_batches: number;
  total_supply_chain_events: number;
  total_lab_records: number;
  total_reconciliations: number;
  total_flagged_anomalies: number;
  total_blockchain_anchors: number;
  active_qr_codes: number;
  batch_status_counts: Record<string, number>;
}

export interface SubsystemStatus {
  status: string;
  details?: Record<string, any>;
}

export interface SystemMonitoringResponse {
  application_status: string;
  version: string;
  timestamp: string;
  database: SubsystemStatus;
  ml_models: SubsystemStatus;
  blockchain: SubsystemStatus;
  qr_capability: SubsystemStatus;
  voice_stt: SubsystemStatus;
}

export interface AuditLogItem {
  id: number;
  actor_id?: number | null;
  actor_email?: string | null;
  actor_role?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  timestamp: string;
}

export interface AuditLogQueryResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
}
