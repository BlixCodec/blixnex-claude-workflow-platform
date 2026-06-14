# AI Architecture

How models are chosen, prompted, grounded, and checked. This document is deliberately precise about *which* model does *what*, because overstating Claude's role would not survive an interview.

> Status labels follow the [honesty legend](../README.md#honesty-legend).

---

## 1. Where AI appears

| Surface | Model role | Primary model | Status |
|---|---|---|---|
| Public sales bot (platform site) | Conversational, retrieval-grounded | Routed (fallback chain) | ✅ |
| Client AI receptionist (voice/SMS/chat) | Conversational, grounded in client data | Routed | ✅ *(supervised)* |
| Prospect competitive research | Bounded web-research agent | **Claude** (+ web search/fetch tools) | 🟡 *(feature-flagged)* |
| Demo HTML generation | Long-form structured generation | **DeepSeek** via OpenRouter | ✅ |
| Vision-QA "critic" | Scores rendered output vs. rubric | **Claude** | 🟡 *(feature-flagged)* |
| AI site editor | Edits a site as a validated JSON patch | **Claude** (primary), routed fallback | ✅ |
| Owner-facing drafting / "Insight" | Drafts messages & reports for approval | Routed | ✅ |
| Embeddings (RAG retrieval) | Vector search over client knowledge | OpenAI embeddings | ✅ |
| Demo imagery | Image generation + real-photo fallback | OpenAI image model | ✅ |

**The honest one-liner:** Claude is the *reasoning, research, QA, and drafting* layer; an open-weight model (DeepSeek) is the *generation workhorse*; OpenAI covers embeddings and images; other providers are routed fallbacks.

---

## 2. Multi-provider model routing

Model choice is **task-based**, not hardcoded to one vendor.

- Each task (e.g. `public_sales`, `site_editor`, `research`, `demo_generation`) maps to a **primary model and a fallback chain**.
- Routing config is **data-driven** (stored in the database, cached briefly) so a task can be re-pointed at a different model without a deploy.
- The router only considers providers whose **API key is present**, and degrades to a **deterministic reply** if every provider in the chain fails.
- Every call logs **tokens, cost, latency, provider, and task** for observability and cost caps.

A sanitized, runnable illustration of this lives in [`../code-samples/ai-routing/`](../code-samples/ai-routing/), and an example routing config is in [`../examples/sample-ai-routing-config.json`](../examples/sample-ai-routing-config.json).

```
task ──► [ primary ] ──fail──► [ fallback 1 ] ──fail──► [ fallback 2 ] ──fail──► deterministic copy
            │                                                                          │
            └──────────────── log tokens / cost / latency ◄───────────────────────────┘
                                          │
                                   budget cap check
```

---

## 3. The render pipeline (generation)

The most involved AI subsystem. It turns a captured lead into a finished, white-labeled site.

**Stages:** claim lead → scrape & enrich intel → derive render inputs → (optional) research → build a **fenced** prompt → **render** → ensure image placeholders filled → validate → **bounded repair** → deterministic white-label transform → re-validate → (optional) vision-QA → QA-driven repair → upload to CDN → persist cost & status.

**Three render modes**, selected by one env flag:

| Mode | How | Status |
|---|---|---|
| **Daemon agent loop** *(default)* | Worker calls an agentic render daemon that uses tools, writes files, and streams events. | ✅ *(production path)* |
| **Composer-direct** | Worker calls the generation model directly (one shot), skipping the agent loop — built for reliability/cost. | 🟡 *(canary, env-gated off)* |
| **Template-fill** | A hand-crafted per-vertical template where the model fills only copy slots; structural slots are deterministic. | 🟡 *(canary, one vertical only)* |

> **Interview-proof note:** the alternate modes are committed and were validated in canary, but the **default production path is the daemon agent loop**. I don't claim the others are live.

---

## 4. Retrieval grounding (RAG)

AI answers are grounded in the **specific client's** data, never generic web knowledge:

- Client knowledge is chunked and embedded; relevant chunks are retrieved per query via full-text + vector search, scoped to the client account.
- The retrieved context is concatenated with the brand profile into a single system prompt with an explicit instruction: *if the answer isn't in this context, don't make it up.*
- This is the technical half of the **source-of-truth contract** (the policy half is in [`responsible-ai-patterns.md`](responsible-ai-patterns.md)).

---

## 5. Prompt construction & versioning

- **Field-by-field assembly.** Render and conversation prompts are built from typed blocks (brand identity, vertical profile, retrieved knowledge, fenced untrusted content) — not string-concatenated ad hoc.
- **Database-backed prompt versions.** Active prompts resolve per-client → global → hardcoded fallback, so a prompt can be rolled forward or back without a deploy, and the voice agent's master prompt is synced from the database.
- **Guardrail prompts are immutable constants** (persona rules, tool-safety contract) kept separate from per-tenant copy.
- **Change discipline.** Prompt changes are versioned and tracked; an example record is in [`../examples/sample-prompt-version.md`](../examples/sample-prompt-version.md).

---

## 6. The QA / critic loop

Generation is never trusted blindly. Output passes through two checkers and a bounded repair:

1. **Deterministic validator** — a rules engine (logo present? placeholder images? fabricated testimonials or ratings? surviving scripts/iframes? slop/repetition?). Blockers trigger repair; warnings ship.
2. **Vision-QA critic (Claude)** — scores the rendered page against a multi-dimension rubric and audits per-claim truthfulness. Low scores are flagged (`completed_with_issues`) but don't silently block.
3. **Bounded repair** — a repair pass re-runs generation, but only within a **fixed repair budget**, and a QA-driven rewrite is accepted **only if the new score is strictly higher** (never regress).

This "generate → critique → bounded-repair, never regress" loop is the core quality mechanism, and it's budget-capped so quality work can't run away on cost.

---

## 7. Claude-assisted development

Beyond runtime, Claude (via Claude Code) was the **build partner** for this platform:

- Architecture exploration and trade-off analysis.
- Independent code review and an adversarial security-audit pass over the render and auth paths.
- Design critique of generated output.
- Documentation — including much of the source material this case study sanitizes.

This is the most defensible "Claude" claim of all: the system was **designed and built in partnership with Claude**, with human ownership of every decision.

---

## 8. Honest limitations

- The **research agent and vision-QA gate are feature-flagged and likely off** unless explicitly enabled per tenant.
- There is **no central model-router abstraction** in every service — some routing is per-call-site constants plus env flags. The clean router in `code-samples/` is the *intended* shape, simplified.
- **Claude is not the render workhorse.** If asked "does Claude generate the sites?", the honest answer is: Claude researches, critiques, drafts, and edits; DeepSeek generates; deterministic code does the white-labeling.
- Prompt versioning is **database/ticket-tracked**, not a formal semantic-version scheme.
