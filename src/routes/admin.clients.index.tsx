import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableSkeleton } from "@/components/admin/Skeletons";
import { Users2 } from "lucide-react";
import { ClientStatusBadge, SubStatusBadge } from "@/components/admin/StatusBadges";
import { ClientDetailSheet } from "@/components/admin/ClientDetailSheet";
import { api } from "@/lib/api/client";
import { useState } from "react";

const searchSchema = z.object({
  client: z.string().optional(),
});


export const Route = createFileRoute("/admin/clients/")({
  validateSearch: zodValidator(searchSchema),
  component: ClientsList,
});

function ClientsList() {
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/admin/clients" });
  const { client: openClientId } = Route.useSearch();
  const [q, setQ] = useState("");
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.clients.list(),
  });
  const { data: subs } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => api.subscriptions.list(),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.clients.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted");
    },
  });

  const subsByClient = new Map<string, typeof subs>();
  (subs ?? []).forEach((s) => {
    const arr = subsByClient.get(s.clientId) ?? [];
    arr.push(s);
    subsByClient.set(s.clientId, arr);
  });
  const latestSub = (id: string) => {
    const arr = subsByClient.get(id);
    if (!arr || arr.length === 0) return undefined;
    return [...arr].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
  };

  const filtered = (clients ?? []).filter((c) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      (c.phone ?? "").toLowerCase().includes(s)
    );
  });

  const openClient = (id: string) =>
    navigate({ search: { client: id }, replace: false });
  const closeClient = () => navigate({ search: {}, replace: false });

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Prospects, active clients, and lapsed accounts."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/clients/import">Bulk import</Link>
            </Button>
            <Button asChild>
              <Link to="/admin/clients/$id" params={{ id: "new" }}>
                <Plus className="mr-1 h-4 w-4" /> New client
              </Link>
            </Button>
          </div>
        }
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search name, email, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {isLoading ? (
        <TableSkeleton columns={7} rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users2 className="h-5 w-5" />}
          title={q ? "No matches" : "No clients yet"}
          description={q ? "Try a different name, email, or phone number." : "Import a spreadsheet or add clients one at a time."}
          action={!q ? (
            <Button asChild>
              <Link to="/admin/clients/$id" params={{ id: "new" }}>
                <Plus className="mr-1 h-4 w-4" /> New client
              </Link>
            </Button>
          ) : undefined}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const s = latestSub(c.id);
                return (
                  <TableRow
                    key={c.id}
                    onClick={() => openClient(c.id)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="font-medium">{c.fullName}</div>
                      <div className="text-xs text-muted-foreground">{c.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell data-label="Email" className="text-sm">{c.email}</TableCell>
                    <TableCell data-label="Source" className="text-xs uppercase text-muted-foreground">{c.source}</TableCell>
                    <TableCell data-label="Plan" className="text-sm">{s?.plan ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell data-label="Subscription">{s ? <SubStatusBadge status={s.status} /> : <span className="text-xs text-muted-foreground">None</span>}</TableCell>
                    <TableCell data-label="Status"><ClientStatusBadge status={c.status} /></TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/admin/clients/$id" params={{ id: c.id }}>Edit</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => confirm(`Delete "${c.fullName}"?`) && del.mutate(c.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <ClientDetailSheet
        clientId={openClientId ?? null}
        onOpenChange={(open) => {
          if (!open) closeClient();
        }}
      />
    </div>
  );
}
