/**
 * Source-of-truth grounding (illustrative, sanitized).
 *
 * The AI may only speak from a SPECIFIC client's configured data. When a
 * fact isn't configured, we do NOT let the model improvise — we inject an
 * explicit refusal directive and (for hard requirements) escalate to a human.
 *
 * This is the data-side contract behind "never fabricate a price or phone."
 */

export interface BrandProfile {
  businessName?: string;
  vertical?: string;
  phone?: string | null;
  /** "configured" | "quote_only" | "unconfigured" */
  pricingMode?: "configured" | "quote_only" | "unconfigured";
  services?: string[];
  businessHours?: string | null;
}

export interface GroundingResult {
  /** The system-prompt block to send to the model. */
  prompt: string;
  /** Hard-missing keys that should halt automation and escalate. */
  mustEscalate: string[];
}

const REFUSALS = {
  phone:
    "PHONE NOT CONFIGURED: do not invent a phone number. Offer to take a message or arrange a callback.",
  pricing:
    "PRICING NOT CONFIGURED: do not quote any dollar amount. Offer that the team will provide a quote.",
  quoteOnly:
    "QUOTE-ONLY MODE: never state a specific price. Always route pricing to a human quote.",
  generic:
    "If a fact is not present in this profile or the knowledge block, say you don't have it and offer to connect a human. Never fabricate.",
} as const;

/**
 * Build a grounded business-identity block.
 * Required keys that are missing are returned in `mustEscalate` so the caller
 * can refuse to run autonomous actions and hand off to the owner.
 */
export function buildGroundedContext(
  profile: BrandProfile,
  requiredKeys: string[] = [],
): GroundingResult {
  const lines: string[] = [];
  const mustEscalate: string[] = [];

  lines.push(`You are the assistant for ${profile.businessName ?? "this business"}.`);
  if (profile.vertical) lines.push(`Industry: ${profile.vertical}.`);
  if (profile.services?.length) lines.push(`Services: ${profile.services.join(", ")}.`);
  if (profile.businessHours) lines.push(`Hours: ${profile.businessHours}.`);

  // Phone
  if (profile.phone) lines.push(`Phone: ${profile.phone}.`);
  else lines.push(REFUSALS.phone);

  // Pricing
  switch (profile.pricingMode) {
    case "configured":
      lines.push("Pricing is configured; quote only from the configured pricing block.");
      break;
    case "quote_only":
      lines.push(REFUSALS.quoteOnly);
      break;
    default:
      lines.push(REFUSALS.pricing);
  }

  lines.push(REFUSALS.generic);

  // Hard requirements: if a required key is unconfigured, escalate.
  for (const key of requiredKeys) {
    const value = (profile as Record<string, unknown>)[key];
    const unset =
      value == null ||
      (key === "pricing" && profile.pricingMode === "unconfigured") ||
      (Array.isArray(value) && value.length === 0);
    if (unset) mustEscalate.push(key);
  }

  return { prompt: lines.join("\n"), mustEscalate };
}
