// Derive a deterministic installment schedule for a subscription, purely
// from the fields we already have (paymentPlan, startDate, endDate,
// nextDueDate, totalPrice, amountPaid). This is Phase 1 — no gateway.

import type { Subscription } from "@/lib/api/types";

export interface InstallmentRow {
  index: number;
  dueDate: string;
  amount: number;
  status: "paid" | "next" | "upcoming";
  label?: string;
}

// Rough count of installments implied by a plan string.
function planCount(plan: string | undefined): number {
  if (!plan) return 4;
  const p = plan.toLowerCase();
  if (p.includes("12")) return 12;
  if (p.includes("6")) return 6;
  if (p.includes("4")) return 4;
  if (p.includes("3-4") || p.includes("3–4")) return 4;
  if (p.includes("3")) return 3;
  const n = parseInt(p, 10);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

export function buildSchedule(sub: Subscription): InstallmentRow[] {
  const total = sub.totalPrice ?? sub.amount ?? 0;
  const paid = sub.amountPaid ?? 0;

  // If admin defined an explicit installment schedule, use it.
  if (sub.installments && sub.installments.length > 0) {
    const sorted = [...sub.installments].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
    let running = 0;
    const rows: InstallmentRow[] = sorted.map((r, i) => {
      running += r.amount;
      return {
        index: i + 1,
        dueDate: r.dueDate,
        amount: r.amount,
        label: r.label,
        status: running <= paid ? "paid" : "upcoming",
      };
    });
    let seenNext = false;
    for (const r of rows) {
      if (r.status === "paid") continue;
      if (!seenNext) { r.status = "next"; seenNext = true; } else { r.status = "upcoming"; }
    }
    return rows;
  }

  const count = planCount(sub.paymentPlan);
  const per = Math.round(total / count);

  const start = new Date(sub.startDate).getTime();
  const end = new Date(sub.endDate).getTime();
  const span = Math.max(end - start, 30 * 86400_000);
  const step = span / count;

  const rows: InstallmentRow[] = [];
  let running = 0;
  for (let i = 0; i < count; i++) {
    const amount = i === count - 1 ? Math.max(0, total - per * (count - 1)) : per;
    running += amount;
    const status: InstallmentRow["status"] =
      running <= paid ? "paid" : running - amount < paid || rows.every((r) => r.status === "paid")
        ? "next"
        : "upcoming";
    // Normalise: only one "next" row.
    rows.push({
      index: i + 1,
      dueDate: new Date(start + step * (i + 1)).toISOString(),
      amount,
      status,
    });
  }
  // Ensure exactly one "next" row (first non-paid).
  let seenNext = false;
  for (const r of rows) {
    if (r.status === "paid") continue;
    if (!seenNext) {
      r.status = "next";
      seenNext = true;
    } else {
      r.status = "upcoming";
    }
  }
  // If a nextDueDate is on the subscription, snap the "next" row to it.
  if (sub.nextDueDate) {
    const nxt = rows.find((r) => r.status === "next");
    if (nxt) nxt.dueDate = sub.nextDueDate;
  }
  return rows;
}

export function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.round(diff / 86400_000);
}