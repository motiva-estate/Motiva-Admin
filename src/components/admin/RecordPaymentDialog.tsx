import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";
import type { Subscription } from "@/lib/api/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscription?: Subscription | null;
  /** When true and no subscription pinned, show subscription picker. */
  allowPick?: boolean;
}

export function RecordPaymentDialog({ open, onOpenChange, subscription, allowPick }: Props) {
  const qc = useQueryClient();
  const { data: subs } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => api.subscriptions.list(),
    enabled: !!allowPick,
  });
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.clients.list(),
    enabled: !!allowPick,
  });

  const [subId, setSubId] = useState<string>("");
  const [amount, setAmount] = useState(0);
  const [label, setLabel] = useState("Installment");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) {
      setSubId(subscription?.id ?? "");
      setAmount(0);
      setLabel("Installment");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, subscription]);

  const activeSub = subscription ?? subs?.find((s) => s.id === subId);

  const record = useMutation({
    mutationFn: async () => {
      if (!activeSub) throw new Error("Pick a subscription");
      return api.payments.record({
        clientId: activeSub.clientId,
        subscriptionId: activeSub.id,
        date: new Date(date).toISOString(),
        label,
        amount,
        currency: activeSub.currency,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Payment recorded");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {allowPick && !subscription && (
            <div className="space-y-2">
              <Label>Subscription</Label>
              <Select value={subId} onValueChange={setSubId}>
                <SelectTrigger><SelectValue placeholder="Select subscription…" /></SelectTrigger>
                <SelectContent>
                  {subs?.map((s) => {
                    const c = clients?.find((x) => x.id === s.clientId);
                    return <SelectItem key={s.id} value={s.id}>{c?.fullName ?? "?"} — {s.plan}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          {activeSub && (
            <div className="rounded-md border border-border p-3 text-xs text-muted-foreground">
              Paid so far: {activeSub.currency} {(activeSub.amountPaid ?? 0).toLocaleString()} of{" "}
              {(activeSub.totalPrice ?? activeSub.amount).toLocaleString()}
            </div>
          )}
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => record.mutate()}
            disabled={!activeSub || amount <= 0 || record.isPending}
          >
            {record.isPending ? "Saving…" : "Record payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}