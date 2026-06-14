# Status & Scope

The honest, line-by-line ledger. If something below reads as modest, that's intentional — the goal is that **every claim survives scrutiny**.

> Status labels follow the [honesty legend](../README.md#honesty-legend).

---

## 1. Headline

- **Stage:** pre-revenue. **Paying customers: zero.**
- **Built by:** one person (me), with Claude as a build partner and one third-party OSS dependency integrated for the design/generation layer.
- **Maturity:** pilot-grade — real architecture and real guardrails, dogfooded on an internal tenant and validated through canary renders and supervised pilots. **Not** certified for unattended production use.

I am not claiming traction, revenue, or production-scale reliability. I am claiming a **working, guardrailed, multi-surface AI system** and the engineering judgment behind it.

---

## 2. Status matrix

| Capability | Status | Honest note |
|---|---|---|
| Multi-tenant edge routing | ✅ Implemented | One code path serves all tenants; resolved at the edge. |
| Per-tenant SEO (robots/sitemap/llms.txt) | ✅ Implemented | Generated from the brand profile; platform attribution stripped. |
| Public sales AI bot | ✅ Implemented | Retrieval-grounded; multi-provider with deterministic fallback. |
| Client-context (source-of-truth) builder | ✅ Implemented | Single aggregation point for what a client's AI may see. |
| Demo render — daemon agent loop | ✅ Implemented | The default production render path. |
| Demo render — composer-direct mode | 🟡 Partial / Canary | Env-gated off; validated in canary. |
| Demo render — template-fill mode | 🟡 Partial / Canary | One vertical only; env-gated off. |
| Prospect intel scrape + brand/logo/palette | ✅ Implemented | Feeds every render. |
| Competitive research agent (Claude) | 🟡 Partial | Feature-flagged; off by default. |
| QA — deterministic validator | ✅ Implemented | Rules engine; fail-closed on dangerous output. |
| QA — vision critic (Claude) | 🟡 Partial | Feature-flagged; flags but doesn't silently block. |
| Bounded repair pass | ✅ Implemented | Budget-capped; never accepts a regression. |
| Deterministic white-label transform | ✅ Implemented | Zero-LLM; fixes branding/metadata reliably. |
| AI receptionist — voice | ✅ Implemented | Operator-supervised pilot. |
| Conversational SMS / iMessage | ✅ Implemented | Inbound auto-reply + outbound cadence. |
| Booking & scheduling | ✅ Implemented | Validation, calendar sync, reminders, no-show handling. |
| Follow-up / lifecycle crons | ✅ Implemented | Speed-to-lead, cold-lead, abandoned-prospect, no-show. |
| Review-reply drafting | ✅ Implemented | AI-drafted; human publishes. |
| Review auto-publish to business profile | 🔵 Planned | Not built — gated on external API approval. |
| Workflow engine + step queue | ✅ Implemented | Trigger-driven; validated; safety-gated. |
| Owner "Insight" delegation (text/portal) | ✅ Implemented | Reporting + approval-gated actions. |
| Owner "Insight" delegation (voice) | 🟡 Partial | Operator-supervised. |
| Owner notifications (in-app/email/SMS) | ✅ Implemented | Push is partial. |
| Billing (checkout/portal/webhooks/overage) | ✅ Implemented | Idempotent webhook handling. |
| Reporting & analytics | ✅ Implemented | Per-tenant dashboards + cost tracking. |
| AI site editor | ✅ Implemented | Edits as a validated JSON patch; Claude primary. |
| **Responsible-AI guardrails** | | |
| Source-of-truth grounding (refuse/escalate) | ✅ Implemented | Won't fabricate price/phone. |
| Approval gates on consequential actions | ✅ Implemented | Pending-approval + explicit confirm. |
| Instruction-fencing of untrusted content | ✅ Implemented | BEGIN/END UNTRUSTED fences. |
| Prompt-injection detection / marker scrub | ✅ Implemented | Strips fake action markers. |
| Prompt-leak / white-label protection | ✅ Implemented | Aborts on leak; scrubs vendor names. |
| Cost & budget caps | ✅ Implemented | Per-render, repair, per-tenant daily, payment ceiling. |
| Opt-out (STOP) guards | ✅ Implemented | Across SMS/iMessage/email. |
| Output sanitizer + validator (fail-closed) | ✅ Implemented | Stored-XSS defense. |
| SSRF guards | ✅ Implemented | Re-checked after redirects. |
| Observability / audit logging | ✅ Implemented | LLM cost, errors, audit trail, render telemetry. |
| Tenant isolation (RLS) | 🟡 Partial | **Comprehensive table-by-table RLS verification is an open hardening task.** Labeled Partial deliberately. |

---

## 3. Known limitations (called out, not hidden)

- **RLS coverage** needs a table-by-table audit before I'd call isolation production-certified.
- **Per-vertical breadth is roadmap.** One service vertical is actually built end-to-end; the multi-vertical ambition currently exists as scoring weights and configuration, not shipped design systems.
- **Some AI features are off by default** (research agent, vision-QA gate, alternate render modes). The production path is intentionally the conservative one.
- **Review auto-publish** is not built.
- **No production scale data** — zero paying customers means real-world load and reliability are unproven.
- **Documentation/code drift** existed in the source repos (e.g. a worker README describing itself as a scaffold while the code was a full pipeline). I've described the *code's* behavior, not stale docs.

---

## 4. Third-party vs. original work

To keep authorship claims clean:

- **Integrated (not mine):** the agent-native design-system / component library and render daemon (`open-design`, Apache-2.0, org `nexu-io`); the model providers; the infrastructure platforms.
- **Original engineering (mine):** the multi-tenant architecture and tenant model; the intel → render → QA pipeline *around* the daemon (prompt construction, fencing, validator/critic, bounded repair, white-label transform, cost control); the workflow engine and lifecycle automation; the conversational grounding and approval-gate system; the responsible-AI guardrail layer; and all of the documentation and operational doctrine.

---

## 5. Roadmap (honest, short)

1. Close the RLS verification work → upgrade tenant isolation to ✅.
2. Promote a hardened single render mode out of canary once cost/quality are proven at volume.
3. Build review auto-publish when external API access is approved.
4. Expand from one shipped vertical to several, codifying per-vertical design conventions.
5. Run a paid pilot to get the first real reliability and unit-economics data.

---

*This document is the contract for honesty in the rest of the case study. If anything elsewhere reads as a stronger claim than the matrix above, the matrix wins.*
