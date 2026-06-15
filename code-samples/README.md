# Code samples

> **Original, sanitized re-implementations — not production source code.** Each sample was written *for this case study* to make a pattern from the private BlixNex codebase concrete. They contain no secrets, no proprietary logic, and no customer data, and they're deliberately small. The whole folder is **strict-mode type-checked**: `npm install && npm run typecheck` (0 errors).

These are the "show, don't tell" half of the repo — the [`docs/`](../docs/) describe the guardrails; this code demonstrates them.

## How to review this section (~5 minutes)

| Read this | To see |
|---|---|
| [`workflow-engine/`](workflow-engine/) | **Approval gates**, **idempotency**, **tenant scoping**, per-run + per-tenant **budget checks**, and a **resumable** (pause-on-approval) workflow executor. |
| [`ai-routing/`](ai-routing/) | Task-based **model routing**, primary→fallback **chains**, provider **key-gating**, **deterministic fallback** (never throw into a user path), and per-call **cost logging**. |
| [`prompt-safety/`](prompt-safety/) | **Instruction fencing** of untrusted content, **source-grounding** (refuse + escalate when data isn't configured), **prompt-leak detection**, **output sanitization**, and the fail-closed posture. |

Each subfolder has its own short README mapping the sample back to the real system.

## What these are *not*

- **Not** the production codebase (that stays private).
- **Not** a runnable app — they're focused, dependency-free modules meant to be **read**, with injected collaborators where the real code would hit a database or an LLM provider.
- **Not** exhaustive — each isolates one or two patterns so a reviewer can grasp the idea in under a minute.

The patterns are explained in full in [`../docs/responsible-ai-patterns.md`](../docs/responsible-ai-patterns.md) and [`../docs/workflow-engine.md`](../docs/workflow-engine.md).
