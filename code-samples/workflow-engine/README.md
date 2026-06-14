# Code sample — Workflow Engine

> **Illustrative & sanitized.** This is a self-contained re-implementation written *for this case study* to demonstrate the patterns used in the production workflow engine. It is **not** copied from the private codebase and contains no secrets or proprietary logic. It has no external dependencies and is meant to be read, not deployed.

## What it demonstrates

- A **trigger-driven, step-based executor** with explicit state (`pending → running → awaiting_approval → completed / failed / halted`).
- **Approval gates** — consequential actions (send message, book, payment link) never execute inline; they stage for human confirmation.
- **Idempotency** — steps carry idempotency keys so retries can't double-act.
- **Budget awareness** — LLM steps consult a cost guard and the run halts when a cap is exhausted.
- **Deterministic fallback** — when a step has no safe automated path, the engine escalates rather than guessing.
- **Tenant scoping** — every action is bound to one `clientAccountId`.

## Files

| File | Role |
|---|---|
| [`types.ts`](types.ts) | The workflow/step/action domain types. |
| [`engine.ts`](engine.ts) | The executor: state machine, approval gating, idempotency, budget checks. |

## Mapping to the real system

| This sample | Production |
|---|---|
| `WorkflowEngine.run()` | Trigger-driven graph executor + async step queue. |
| `CONSEQUENTIAL_ACTIONS` | The fixed approval-required action set. |
| `ApprovalStore` | `pending_approval` rows previewed to the owner, executed on explicit "Y". |
| `CostGuard` (interface) | Per-run LLM budget + per-tenant daily cap. |
| `escalateToOwner()` | The source-of-truth "refuse and escalate" contract. |

See [`../../docs/workflow-engine.md`](../../docs/workflow-engine.md) for the architecture.
