import type { Subscription, SubscriberDocument } from "@/lib/api/types";

// Milestones a subscription has reached. In this Phase 1 build the only
// automated milestone is "full-payment"; anything else must be flagged
// manually by an admin (future work).
export function subscriptionMilestones(sub: Subscription): Set<string> {
  const set = new Set<string>();
  const total = sub.totalPrice ?? sub.amount ?? 0;
  const paid = sub.amountPaid ?? 0;
  if (total > 0 && paid >= total) set.add("full-payment");
  return set;
}

export function isDocumentVisible(doc: SubscriberDocument, sub: Subscription | undefined): boolean {
  if (!sub) return false;
  if (doc.visibility === "immediate") return true;
  const milestones = subscriptionMilestones(sub);
  if (doc.visibility === "on_full_payment") return milestones.has("full-payment");
  if (doc.visibility.startsWith("on_milestone:")) {
    const name = doc.visibility.slice("on_milestone:".length);
    return milestones.has(name);
  }
  return false;
}

// Phase 1: pass-through. In production this returns a signed, time-limited
// URL from the storage backend.
export function resolveDocumentUrl(doc: SubscriberDocument, sub: Subscription | undefined): string | null {
  return isDocumentVisible(doc, sub) ? doc.fileUrl : null;
}

export function currency(amount: number, code = "NGN") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString()}`;
  }
}