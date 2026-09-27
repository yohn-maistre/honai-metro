/**
 * ETNOS public product contracts.
 *
 * These are presentation/coordination objects for the public federated plane.
 * They are deliberately NOT Aksara kernel authority types, private memory
 * records, A2A message history, or execution credentials.
 */

export type PublicActorRole =
  | 'human'
  | 'organization'
  | 'community'
  | 'institutional_agent'
  | 'service_agent'
  | 'evidence_monitor'

export type AutomationMode =
  | 'human'
  | 'assisted'
  | 'autonomous_with_gates'

export interface PublicActorPresentation {
  actor_ref: string
  display_name: string
  role: PublicActorRole
  institution_ref?: string
  automation?: AutomationMode
  /** Discovery only. An Agent Card never grants ETNOS/Aksara authority. */
  agent_card_url?: string
  governance_note?: string
}

export type PublicWorkType =
  | 'data_request'
  | 'literature_request'
  | 'collaboration'
  | 'review'
  | 'release'
  | 'service_request'

export type PublicWorkStatus =
  | 'open'
  | 'active'
  | 'waiting_human'
  | 'completed'
  | 'closed'

export type PublicVisibility = 'public' | 'bounded' | 'outcome_only'

export interface PublicArtifact {
  id: string
  work_ref?: string
  kind:
    | 'dataset'
    | 'method_note'
    | 'literature_matrix'
    | 'report'
    | 'source_bundle'
    | 'receipt'
    | 'other'
  title: string
  summary?: string
  canonical_url?: string
  media_type?: string
  provenance?: Record<string, unknown>
  published_at?: string
}

export type PublicTraceKind =
  | 'request_accepted'
  | 'policy_checked'
  | 'peer_contacted'
  | 'human_review_requested'
  | 'public_safe_result_received'
  | 'artifact_published'
  | 'outcome_recorded'

export interface PublicTraceEvent {
  id: string
  work_ref: string
  kind: PublicTraceKind
  /** Redacted human-readable milestone only. Never hidden reasoning. */
  summary?: string
  occurred_at: string
  actor_ref?: string
  artifact_ref?: string
}

export interface PublicWork {
  id: string
  canonical_post_ref: string
  work_type: PublicWorkType
  status: PublicWorkStatus
  owner_actor_ref: string
  steward_ref?: string
  communities: string[]
  places: string[]
  contributors: string[]
  requested_capabilities: string[]
  artifacts: PublicArtifact[]
  visibility: PublicVisibility
  provenance?: Record<string, unknown>
  public_trace_ref?: string
  created_at: string
  updated_at: string
}

/**
 * Server/private linkage for the governed execution plane. This must never be
 * serialized merely because the related PublicWork is visible in ETNOS.
 */
export interface WorkExecutionLinkage {
  work_id: string
  a2a_context_refs: string[]
  a2a_task_refs?: string[]
}
