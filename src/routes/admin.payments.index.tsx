import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, Wallet } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { Paginator } from "@/components/admin/Paginator";
import { RecordPaymentDialog } from "@/components/admin/RecordPaymentDialog";
import { api } from "@/lib/api/client";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/admin/payments/")({
  component: PaymentsList,
});

function PaymentsList() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data: result } = useQuery({
    queryKey: ["payments", page],
    queryFn: () => api.payments.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const { data: clientsResult } = useQuery({
    queryKey: ["clients", "all"],
    queryFn: () => api.clients.list({ limit: 200 }),
  });

  const { data: subsResult } = useQuery({
    queryKey: ["subscriptions", "all"],
    queryFn: () => api.subscriptions.list({ limit: 200 }),
  });

  const payments = result?.data ?? [];
  const total = result?.total ?? 0;
  const clients = clientsResult?.data ?? [];
  const subs = subsResult?.data ?? [];

  const clientName = (id: string) => clients.find((c) => c._id === id)?.fullName ?? "—";
  const subName = (id?: string) => (id ? subs.find((s) => s._id === id)?.plan : undefined) ?? "—";

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

      {payments.length === 0 ? (
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
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(p.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{clientName(p.clientId)}</TableCell>
                  <TableCell className="text-sm">{subName(p.subscriptionId)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.label}</TableCell>
                  <TableCell>
                    {p.currency} {p.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 pb-3">
            <Paginator page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </Card>
      )}
    </div>
  );
}
