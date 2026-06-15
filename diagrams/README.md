# Diagrams

Four Mermaid diagrams (GitHub renders them inline) live in [`lifecycle-architecture.md`](lifecycle-architecture.md). Sanitized — no real tenants, internal URLs, keys, or secrets; the only named vendors are the public tech stack. Built to be skimmable in **60–90 seconds**.

## What each diagram proves

| # | Diagram | What it shows a reviewer |
|---|---|---|
| 1 | **System architecture** | How the pieces fit — operator + client apps, the Supabase database, the Redis/BullMQ queue, the render worker, object storage/CDN, and where multi-provider AI routing sits. |
| 2 | **Lead → customer lifecycle** | The business spine end-to-end: **Discover → Demo → Answer → Book → Nurture → Reputation → Automate → Operate**, including the human **approval gate** before any consequential action. |
| 3 | **Render pipeline (with guardrails)** | The demo-generation flow with its safety rails: fenced prompt → deterministic validator → **bounded** repair → white-label transform → fail-closed sanitize. |
| 4 | **Responsible-AI defense-in-depth** | The guardrail loop: source-grounding, instruction fencing, routed + budget-capped models, approval gates, validate/repair, and observability + audit logging. |

**Operations & handoff** (logs, runbooks, monitoring, ownership transfer) aren't a diagram — they're written up in [`../docs/handoff-runbook.md`](../docs/handoff-runbook.md) and the honest status matrix in [`../docs/status-and-scope.md`](../docs/status-and-scope.md).

> All four render natively in GitHub's web view. If your Markdown viewer doesn't support Mermaid, open the file on GitHub.
