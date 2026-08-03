import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { useDirty } from "@/lib/use-dirty";
import type { Installment, Subscription, SubscriptionStatus } from "@/lib/api/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: Subscription | null;
  fixedClientId?: string;
}

const emptyForm = (clientId?: string): Partial<Subscription> => ({
  clientId: clientId ?? "",
  plan: "",
  status: "PENDING",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 365 * 86400_000).toISOString().slice(0, 10),
  amount: 0,
  currency: "NGN",
  autoRenew: false,
  projectRefType: "project",
  projectRef: "",
  totalPrice: 0,
  amountPaid: 0,
  paymentPlan: "Custom",
  installments: [],
});

export function SubscriptionFormDialog({ open, onOpenChange, existing, fixedClientId }: Props) {
  const qc = useQueryClient();
  const { data: clientsResult } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.clients.list({ limit: 200 }),
  });
  const clients = clientsResult?.data ?? [];
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });
  const { data: lands } = useQuery({ queryKey: ["land"], queryFn: () => api.land.list() });

  const [form, setForm] = useState<Partial<Subscription>>(emptyForm(fixedClientId));

  const { isDirty, markClean, resetBaseline } = useDirty(form, null);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      const initial = {
        ...existing,
        startDate: existing.startDate.slice(0, 10),
        endDate: existing.endDate.slice(0, 10),
        installments: existing.installments ?? [],
      };
      setForm(initial);
      resetBaseline(initial);
    } else {
      const initial = emptyForm(fixedClientId);
      setForm(initial);
      resetBaseline(initial);
    }
  }, [open, existing, fixedClientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async () => {
      const payload: Partial<Subscription> = {
        ...form,
        startDate: new Date(form.startDate as string).toISOString(),
        endDate: new Date(form.endDate as string).toISOString(),
        installments: (form.installments ?? []).map((r, i) => ({ ...r, index: i + 1 })),
      };
      return existing
        ? api.subscriptions.update(existing._id, payload)
        : api.subscriptions.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      if (fixedClientId) qc.invalidateQueries({ queryKey: ["subscriptions", fixedClientId] });
      markClean();
      toast.success(existing ? "Subscription updated" : "Subscription created");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message ?? "Save failed"),
  });

  const rows: Installment[] = form.installments ?? [];
  const setRows = (next: Installment[]) => setForm((f) => ({ ...f, installments: next }));
  const addRow = () =>
    setRows([
      ...rows,
      {
        index: rows.length + 1,
        label: `Installment ${rows.length + 1}`,
        dueDate: new Date().toISOString().slice(0, 10),
        amount: 0,
      },
    ]);
  const updateRow = (i: number, patch: Partial<Installment>) => {
    const next = rows.slice();
    next[i] = { ...next[i], ...patch };
    setRows(next);
  };
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  const scheduleTotal = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const refOptions = form.projectRefType === "land" ? (lands ?? []) : (projects ?? []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit subscription" : "New subscription"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {!fixedClientId && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Client</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label>Plan / name</Label>
              <Input
                value={form.plan ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                placeholder="Casa Solano — Residence Purchase"
              />
            </div>
            <div className="space-y-2">
              <Label>Ref type</Label>
              <Select
                value={form.projectRefType ?? "project"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    projectRefType: v as "project" | "land",
                    projectRef: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project / Residence</SelectItem>
                  <SelectItem value="land">Land parcel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Linked {form.projectRefType === "land" ? "land parcel" : "project"}</Label>
              <Select
                value={form.projectRef ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, projectRef: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {refOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {"title" in o ? (o as { title: string }).title : (o as { name: string }).name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agreement start</Label>
              <Input
                type="date"
                value={form.startDate as string}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Agreement end</Label>
              <Input
                type="date"
                value={form.endDate as string}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Total price</Label>
              <Input
                type="number"
                value={form.totalPrice ?? 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    totalPrice: Number(e.target.value),
                    amount: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={form.currency ?? "NGN"}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount paid to date</Label>
              <Input
                type="number"
                value={form.amountPaid ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, amountPaid: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                Updated automatically when payments are recorded.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Next due date</Label>
              <Input
                type="date"
                value={form.nextDueDate ? form.nextDueDate.slice(0, 10) : ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    nextDueDate: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Payment plan label</Label>
              <Input
                value={form.paymentPlan ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, paymentPlan: e.target.value }))}
                placeholder="12mo, 3-4mo, Custom…"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as SubscriptionStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch
                checked={!!form.autoRenew}
                onCheckedChange={(v) => setForm((f) => ({ ...f, autoRenew: v }))}
              />
              <Label>Auto-renew</Label>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Installment schedule</div>
                <p className="text-xs text-muted-foreground">
                  Sum: {scheduleTotal.toLocaleString()} {form.currency}
                  {form.totalPrice ? ` / total ${form.totalPrice.toLocaleString()}` : ""}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1 h-4 w-4" /> Add row
              </Button>
            </div>
            {rows.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No rows — the portal will fall back to a derived schedule.
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-12 items-center gap-2">
                    <Input
                      className="col-span-4"
                      placeholder="Label"
                      value={r.label ?? ""}
                      onChange={(e) => updateRow(i, { label: e.target.value })}
                    />
                    <Input
                      className="col-span-4"
                      type="date"
                      value={r.dueDate.slice(0, 10)}
                      onChange={(e) =>
                        updateRow(i, { dueDate: new Date(e.target.value).toISOString() })
                      }
                    />
                    <Input
                      className="col-span-3"
                      type="number"
                      value={r.amount}
                      onChange={(e) => updateRow(i, { amount: Number(e.target.value) })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-span-1"
                      onClick={() => removeRow(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={() => save.mutate()}
            disabled={!form.clientId || !form.plan || save.isPending || !isDirty}
          >
            {save.isPending ? "Saving…" : existing ? "Save changes" : "Create subscription"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
