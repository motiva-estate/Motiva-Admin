import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SubStatusBadge } from "@/components/admin/StatusBadges";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableSkeleton } from "@/components/admin/Skeletons";
import { CreditCard, Pencil, Plus } from "lucide-react";
import { api } from "@/lib/api/client";
import type { Subscription } from "@/lib/api/types";
import { SubscriptionFormDialog } from "@/components/admin/SubscriptionFormDialog";

export const Route = createFileRoute("/admin/subscriptions/")({
  component: SubsList,
});

function SubsList() {
  const { data: subs, isLoading } = useQuery({ queryKey: ["subscriptions"], queryFn: () => api.subscriptions.list() });
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: () => api.clients.list() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const clientName = (id: string) => clients?.find((c) => c.id === id)?.fullName ?? "—";

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Property, land and concierge subscriptions per client. Link each to a project or land parcel and manage the payment plan."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> New subscription
          </Button>
        }
      />
      <SubscriptionFormDialog open={open} onOpenChange={setOpen} existing={editing} />
      {isLoading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : !subs || subs.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-5 w-5" />}
          title="No subscriptions"
          description="Add a subscription from a client's profile or here."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Linked to</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Paid / Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{clientName(s.clientId)}</TableCell>
                  <TableCell data-label="Plan">{s.plan}</TableCell>
                  <TableCell data-label="Linked to" className="text-xs text-muted-foreground">
                    {s.projectRef ? `${s.projectRefType ?? "project"} · ${s.projectRef}` : "—"}
                  </TableCell>
                  <TableCell data-label="Period" className="text-sm text-muted-foreground">
                    {format(new Date(s.startDate), "MMM d, yyyy")} → {format(new Date(s.endDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell data-label="Paid / Total" className="text-sm">
                    {s.currency} {(s.amountPaid ?? 0).toLocaleString()} / {(s.totalPrice ?? s.amount).toLocaleString()}
                  </TableCell>
                  <TableCell data-label="Status"><SubStatusBadge status={s.status} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(s); setOpen(true); }}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
