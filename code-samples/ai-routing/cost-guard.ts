/**
 * Cost guard (illustrative, sanitized).
 *
 * Demonstrates two of the production budget layers:
 *   • a per-tenant DAILY LLM spend cap
 *   • a per-run BOUNDED REPAIR budget (repairs stop when the delta is spent,
 *     shipping the best result so far instead of looping unboundedly)
 *
 * The store is abstracted; production reads/writes spend rows in Postgres.
 */

export interface SpendStore {
  /** Total LLM spend (USD) for this tenant within the current day. */
  todaySpendUsd(clientAccountId: string): Promise<number>;
  add(clientAccountId: string, usd: number): Promise<void>;
}

export interface CostGuardConfig {
  /** Per-tenant daily ceiling. */
  dailyCapUsd: number;
  /** Bounded budget for a single render's repair passes. */
  repairBudgetUsd: number;
}

export class CostGuard {
  constructor(
    private readonly store: SpendStore,
    private readonly cfg: CostGuardConfig,
    private readonly log: (event: string, data: Record<string, unknown>) => void,
  ) {}

  /** Returns false when spending `estimateUsd` more would breach the daily cap. */
  async canSpend(clientAccountId: string, estimateUsd: number): Promise<boolean> {
    const spent = await this.store.todaySpendUsd(clientAccountId);
    const ok = spent + estimateUsd <= this.cfg.dailyCapUsd;
    if (!ok) {
      this.log("cost.daily_cap_reached", { clientAccountId, spent, cap: this.cfg.dailyCapUsd });
    }
    return ok;
  }

  async record(clientAccountId: string, actualUsd: number): Promise<void> {
    await this.store.add(clientAccountId, actualUsd);
  }

  /**
   * Bounded repair loop. Runs repair attempts only while budget remains AND
   * each attempt strictly improves quality — never regress, never overspend.
   */
  async runBoundedRepair<T>(opts: {
    clientAccountId: string;
    initial: { result: T; score: number };
    attempt: () => Promise<{ result: T; score: number; costUsd: number }>;
    maxAttempts?: number;
  }): Promise<{ result: T; score: number; repaired: boolean }> {
    let best = opts.initial;
    let spent = 0;
    let repaired = false;
    const maxAttempts = opts.maxAttempts ?? 3;

    for (let i = 0; i < maxAttempts; i++) {
      if (spent >= this.cfg.repairBudgetUsd) {
        this.log("render.qa.repair_budget_exceeded", {
          clientAccountId: opts.clientAccountId, spent, budget: this.cfg.repairBudgetUsd,
        });
        break;
      }

      const next = await opts.attempt();
      spent += next.costUsd;
      await this.record(opts.clientAccountId, next.costUsd);

      // Accept ONLY if strictly better — guarantees no regression.
      if (next.score > best.score) {
        best = { result: next.result, score: next.score };
        repaired = true;
      } else {
        break; // no improvement; stop spending
      }
    }

    return { ...best, repaired };
  }
}
