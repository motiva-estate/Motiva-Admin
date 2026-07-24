import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, Wallet } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { RecordPaymentDialog } from "@/components/admin/RecordPaymentDialog";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/admin/payments/")({
  component: PaymentsList,
});

function PaymentsList() {
  const { data: payments } = useQuery({ queryKey: ["payments"], queryFn: () => api.payments.list() });
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: () => api.clients.list() });
  const { data: subs } = useQuery({ queryKey: ["subscriptions"], queryFn: () => api.subscriptions.list() });
  const [open, setOpen] = useState(false);

  const rows = (payments ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const clientName = (id: string) => clients?.find((c) => c.id === id)?.fullName ?? "—";
  const subName = (id?: string) => (id ? subs?.find((s) => s.id === id)?.plan : undefined) ?? "—";

  return (
    <div>
      <PageHeader
        title="Payments"
        description="All payments recorded against subscriptions. Recording a payment updates the subscription's paid total and next due date."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Record payment
          </Button>
        }
      />
      <RecordPaymentDialog open={open} onOpenChange={setOpen} allowPick />
      {rows.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-5 w-5" />}
          title="No payments recorded"
          description="Record a payment from a subscription or from this page."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell data-label="Date" className="text-sm text-muted-foreground">{format(new Date(p.date), "MMM d, yyyy")}</TableCell>
                  <TableCell data-label="Client" className="font-medium">{clientName(p.clientId)}</TableCell>
                  <TableCell data-label="Subscription" className="text-sm">{subName(p.subscriptionId)}</TableCell>
                  <TableCell data-label="Label" className="text-sm text-muted-foreground">{p.label}</TableCell>
                  <TableCell data-label="Amount">{p.currency} {p.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}