# Code sample — AI Model Routing & Cost Guard

> **Illustrative & sanitized.** Self-contained re-implementation written for this case study. No secrets, no proprietary code, no external dependencies.

## What it demonstrates

- **Task-based routing** — each task maps to a primary model + a fallback chain, not a single hardcoded vendor.
- **Key-availability gating** — only providers whose API key is configured are considered.
- **Graceful degradation** — if every provider in the chain fails, the router returns a **deterministic fallback** instead of throwing into a user path.
- **Full-call accounting** — every attempt logs provider, task, tokens, cost, latency, and outcome.
- **Budget enforcement** — a `CostGuard` enforces a per-tenant daily cap and a bounded repair budget, the way the production render path does.

## Files

| File | Role |
|---|---|
| [`router.ts`](router.ts) | Task → primary/fallback routing with key gating + deterministic fallback. |
| [`cost-guard.ts`](cost-guard.ts) | Per-tenant daily cap + bounded repair-budget accounting. |

## Honest mapping to the real system

- Claude is the primary for reasoning/QA/drafting tasks; **DeepSeek (via OpenRouter) is the primary for HTML generation** — see [`../../docs/ai-architecture.md`](../../docs/ai-architecture.md).
- The production router is **database-driven** (task→model config is data, not code) and cached briefly; this sample hardcodes a config object for readability.
- Real budgets: hard per-render ceiling, bounded repair budget, per-tenant daily LLM cap, and a ceiling on AI-emitted payment amounts.
