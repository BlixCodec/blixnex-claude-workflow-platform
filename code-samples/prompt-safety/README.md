# Code sample — Prompt Safety

> **Illustrative & sanitized.** Self-contained re-implementations of the platform's prompt-safety patterns, written for this case study. No secrets, no proprietary prompts, no external dependencies.

## What it demonstrates

| File | Pattern | Defends against |
|---|---|---|
| [`instruction-fence.ts`](instruction-fence.ts) | Fence untrusted content as DATA, not instructions; detect injection patterns. | Indirect prompt injection (OWASP LLM01). |
| [`source-grounding.ts`](source-grounding.ts) | Build a grounded prompt from configured client data; **refuse + escalate** when a fact isn't configured. | Fabricated prices/phones/guarantees. |
| [`output-sanitizer.ts`](output-sanitizer.ts) | Scrub vendor/brand names, detect system-prompt leaks, strip fake action markers, fail-closed HTML allowlist. | White-label breaks, prompt leaks, stored XSS. |

These map directly to the patterns catalogued in [`../../docs/responsible-ai-patterns.md`](../../docs/responsible-ai-patterns.md).

## Design principle

**No single layer is trusted to be sufficient.** Untrusted input is fenced *and* scrubbed; the model is grounded *and* its output is validated; consequential actions are gated *and* logged. Defense in depth is the whole point.
