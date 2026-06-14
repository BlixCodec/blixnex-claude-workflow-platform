# Handoff Runbook

How another engineer or owner takes this system over without me in the room. This is the "safe handoff" artifact — environments, secrets discipline, deploy flow, operational doctrines, and runbooks.

> Sanitized: real hostnames, project IDs, and credentials are placeholders. The point is the *shape* of operations, not live access.

---

## 1. Environments & topology

| Component | Host | Deploy trigger |
|---|---|---|
| Web API + edge | Vercel | Auto-deploy on merge to the default branch; preview deploy per PR. |
| Operator + client portal | Vercel | Same. |
| Intel / render worker | Railway | Deploy on merge / `railway up`. |
| Render daemon | Railway | Deploy on merge. *(third-party OSS — see Attributions)* |
| Crawl sidecar | Railway | Long-running service. |
| Database / auth / functions | Supabase | Migrations + edge-function deploys (CLI). |
| Object storage / CDN | Cloudflare R2 | Provisioned once; keys in env. |

See [`architecture.md`](architecture.md) for how these talk to each other.

---

## 2. Secrets management

- **All secrets are platform environment variables.** None live in the repo. [`../.env.example`](../.env.example) is the **contract** — it lists every variable by name with a placeholder value.
- **On handoff, rotate everything.** Treat any credential that has ever left a secure store as compromised: rotate provider API keys, the Supabase service-role key, the render-daemon shared secret, R2 keys, comms keys, and Stripe keys.
- **Least privilege.** The service-role key is server-only and must never reach a client bundle. Client surfaces use the anon key + row-level security.
- **Verify before first deploy:** every variable in `.env.example` has a real value set in each environment; no placeholder values remain.

---

## 3. Deploy pipeline

1. **Branch & PR.** Never commit straight to the default branch in a shared tree. (See change-safety below.)
2. **CI / review.** Typecheck, tests, and a diff review pass before merge.
3. **Merge → auto-deploy** for Vercel surfaces; deploy the worker/daemon on Railway.
4. **Database changes** ship as migrations + edge-function deploys via the Supabase CLI — apply migrations *before* the code that depends on them.
5. **Post-deploy canary** — verify a real flow (see §6) before considering it done.

---

## 4. Change-safety doctrines

Hard-won operational rules. These prevent the most expensive mistakes.

- **🛑 Never deploy while a render is in flight.** A worker/daemon redeploy sends SIGTERM and **orphans the in-flight agent**, wasting spend and leaving a half-rendered job. **Pre-deploy gate:** confirm no job is in a `rendering` state before triggering a worker/daemon deploy.
- **Feature flags are the rollback mechanism.** Risky paths (alternate render modes, vision-QA gate, research agent) are env-gated. To disable, unset the flag — don't redeploy code. Know each flag's default state (most AI-extra features default **off**).
- **Branch hygiene with parallel work.** If multiple sessions/agents share a working tree, isolate with separate git worktrees; verify the current branch before every commit. Cross-tree commits land on the wrong branch silently.
- **Tune cost caps before scaling traffic.** The repair-budget and per-render ceilings are env-configurable; review them before increasing render volume.
- **Migrations are forward-first.** Write reversible migrations; apply before dependent code.

---

## 5. Observability — where to look

| Question | Where |
|---|---|
| Did an AI call cost too much? | LLM-call log (tokens + cost per call + task + provider). |
| Why did a render fail / what did it cost? | Render-cost + render-status tables; named render telemetry events. |
| Is a user-facing path erroring? | Structured error log. |
| Who did a sensitive action and when? | Audit trail. |
| Is the worker alive? | Worker health endpoint + Railway service status. |

---

## 6. Runbooks

**A render is stuck in `rendering`.**
1. Check render telemetry for the last phase emitted and the job's cost so far.
2. If it exceeded the cost ceiling, expect an `aborted_cost_cap` record — the cap worked as designed.
3. Confirm the daemon and sidecar are healthy. Do **not** redeploy to "fix" it while other renders are in flight (see §4).

**Costs spiked.**
1. Group the LLM-call log by task/provider to find the source.
2. Check whether a feature flag was flipped on (research agent / vision-QA) or a repair loop ran hot.
3. Lower the relevant budget cap (env) and/or disable the flag — no code deploy needed.

**A tenant page shows wrong/placeholder content.**
1. Confirm the custom domain is `active` and resolves to the right client account.
2. Confirm the brand profile is populated — the system intentionally shows a `noindex` provisioning placeholder rather than fabricating content.
3. Check the edge tenant-resolution telemetry/error log.

**A prompt change regressed quality.**
1. Prompts are database-versioned — roll back to the previous active version (no deploy).
2. Compare QA scores before/after via the render telemetry.

**Suspected prompt-injection / bad output.**
1. Confirm untrusted content is being fenced (it should be) and the injection scrub ran.
2. Check the output sanitizer/validator results for that render — a fail-closed result is the system working.

---

## 7. Handoff checklist

- [ ] Repo access transferred; branch protections in place.
- [ ] Every `.env.example` variable set in every environment; **all credentials rotated**.
- [ ] Supabase project access transferred; migration history understood.
- [ ] Railway + Vercel + Cloudflare + Stripe + comms accounts transferred.
- [ ] Feature-flag default states documented and confirmed.
- [ ] Cost caps reviewed for the expected traffic.
- [ ] A canary render + a test booking + a test inbound message verified end-to-end.
- [ ] On-call / escalation path agreed.
- [ ] This runbook read and questions resolved.

---

## 8. Honest operational caveats

- This is a **pilot-grade** system operated under supervision; treat it as such until the hardening items in [`status-and-scope.md`](status-and-scope.md) (notably comprehensive RLS verification) are closed.
- The **render daemon and design-system library are third-party OSS**; upstream changes there can affect generation. Pin versions and track upstream.
- Zero paying customers to date — load characteristics at real scale are unproven.
