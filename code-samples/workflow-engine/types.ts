/**
 * Workflow engine — domain types (illustrative, sanitized).
 *
 * Self-contained: no imports, no secrets. Demonstrates the shape of the
 * production engine's contracts, not its actual code.
 */

export type StepStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "skipped";

export type RunStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "halted_budget";

/** Actions that touch the real world and therefore require owner approval. */
export const CONSEQUENTIAL_ACTIONS = [
  "send_message",
  "book_appointment",
  "send_payment_link",
] as const;
export type ConsequentialAction = (typeof CONSEQUENTIAL_ACTIONS)[number];

export type StepKind = "llm" | "action" | "branch" | "delay" | "notification";

export interface BaseStep {
  id: string;
  kind: StepKind;
  /** Next step id, or null to terminate this path. */
  next?: string | null;
}

export interface LlmStep extends BaseStep {
  kind: "llm";
  task: string;
  /** Fields whose content is untrusted and must be fenced before prompting. */
  untrustedFields?: string[];
  /** Hard requirement: only run if these source-of-truth keys are configured. */
  requires?: string[];
}

export interface ActionStep extends BaseStep {
  kind: "action";
  action: string;
  /** Stable key so a retried step cannot double-act. */
  idempotencyKey: string;
  /** Honor recipient opt-out before sending. */
  respectOptOut?: boolean;
}

export interface BranchStep extends BaseStep {
  kind: "branch";
  /** Path into the run context, e.g. "qualify.intent". */
  on: string;
  cases: Record<string, string>;
  default: string;
}

export type Step = LlmStep | ActionStep | BranchStep | BaseStep;

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: number;
  trigger: { event: string };
  steps: Step[];
  budget?: { maxLlmCostUsdPerRun: number };
  /** Source-of-truth keys the whole workflow depends on. */
  contextRequirements?: { sourceOfTruth: string[]; onMissing: "escalate_to_owner" };
}

export interface RunContext {
  runId: string;
  clientAccountId: string;
  trigger: Record<string, unknown>;
  /** Per-step outputs, keyed by step id. */
  outputs: Record<string, unknown>;
  status: RunStatus;
  spentUsd: number;
}

/** Pluggable collaborators (real implementations hit the DB / providers). */
export interface CostGuard {
  /** Throws or returns false when a cap would be exceeded. */
  canSpend(clientAccountId: string, estimatedUsd: number): Promise<boolean>;
  record(clientAccountId: string, actualUsd: number): Promise<void>;
}

export interface ApprovalStore {
  /** Stage a consequential action for owner confirmation; returns a draft id. */
  stage(input: {
    runId: string;
    clientAccountId: string;
    action: ConsequentialAction | string;
    preview: string;
    idempotencyKey: string;
  }): Promise<{ draftId: string; status: "awaiting_approval" }>;
}

export interface ActionRunner {
  /** Execute a non-consequential or already-approved action, tenant-scoped. */
  execute(input: {
    clientAccountId: string;
    action: string;
    idempotencyKey: string;
    respectOptOut?: boolean;
  }): Promise<{ ok: boolean; skipped?: "opted_out" | "duplicate" }>;
}

export interface LlmRunner {
  run(input: {
    task: string;
    grounded: boolean;
    fencedInput: string;
  }): Promise<{ output: unknown; costUsd: number }>;
}
