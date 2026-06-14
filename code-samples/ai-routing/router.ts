/**
 * Task-based model router (illustrative, sanitized).
 *
 * Demonstrates: per-task primary + fallback chain, provider-key gating,
 * per-attempt accounting, and deterministic degradation. Provider calls
 * are stubbed; in production each `invoke` hits a real SDK/HTTP endpoint.
 */

export interface ModelRef {
  provider: string;
  model: string;
}

export interface TaskRoute {
  primary: ModelRef;
  fallbacks: ModelRef[];
  /** Returned to the user if every provider fails — never throw into a UX path. */
  deterministicFallback: (input: string) => string;
}

export interface CallLog {
  task: string;
  provider: string;
  model: string;
  tokens: number;
  costUsd: number;
  latencyMs: number;
  outcome: "ok" | "error" | "skipped_no_key";
}

export interface RouterDeps {
  /** Which providers have a configured API key this environment. */
  hasKey(provider: string): boolean;
  /** Stubbed provider invocation. Throws on provider error. */
  invoke(ref: ModelRef, input: string): Promise<{ text: string; tokens: number; costUsd: number }>;
  now(): number;
  log(entry: CallLog): void;
}

export class ModelRouter {
  constructor(
    private readonly routes: Record<string, TaskRoute>,
    private readonly deps: RouterDeps,
  ) {}

  async route(task: string, input: string): Promise<{ text: string; usedFallback: boolean }> {
    const route = this.routes[task];
    if (!route) throw new Error(`no route configured for task: ${task}`);

    const chain = [route.primary, ...route.fallbacks];

    for (const ref of chain) {
      // Skip providers without a configured key rather than failing the call.
      if (!this.deps.hasKey(ref.provider)) {
        this.deps.log({
          task, provider: ref.provider, model: ref.model,
          tokens: 0, costUsd: 0, latencyMs: 0, outcome: "skipped_no_key",
        });
        continue;
      }

      const started = this.deps.now();
      try {
        const res = await this.deps.invoke(ref, input);
        this.deps.log({
          task, provider: ref.provider, model: ref.model,
          tokens: res.tokens, costUsd: res.costUsd,
          latencyMs: this.deps.now() - started, outcome: "ok",
        });
        return { text: res.text, usedFallback: ref !== route.primary };
      } catch {
        this.deps.log({
          task, provider: ref.provider, model: ref.model,
          tokens: 0, costUsd: 0,
          latencyMs: this.deps.now() - started, outcome: "error",
        });
        // fall through to the next provider in the chain
      }
    }

    // Everything failed: degrade deterministically, don't throw into the user path.
    return { text: route.deterministicFallback(input), usedFallback: true };
  }
}

/** Example config (production loads this from the database). */
export const EXAMPLE_ROUTES: Record<string, TaskRoute> = {
  public_sales: {
    primary: { provider: "anthropic", model: "claude-sonnet" },
    fallbacks: [
      { provider: "openai", model: "gpt-class-mini" },
      { provider: "groq", model: "open-weight-fast" },
    ],
    deterministicFallback: () =>
      "Thanks for reaching out! A team member will follow up shortly.",
  },
  demo_generation: {
    // DeepSeek is the HTML-generation workhorse; Claude is the fallback agent.
    primary: { provider: "openrouter", model: "deepseek-class-pro" },
    fallbacks: [{ provider: "anthropic", model: "claude-sonnet" }],
    deterministicFallback: () => "<!-- render unavailable: queued for retry -->",
  },
};
