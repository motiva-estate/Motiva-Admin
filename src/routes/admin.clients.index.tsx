import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableSkeleton } from "@/components/admin/Skeletons";
import { Users2 } from "lucide-react";
import { ClientStatusBadge, SubStatusBadge } from "@/components/admin/StatusBadges";
import { ClientDetailSheet } from "@/components/admin/ClientDetailSheet";
import { Paginator } from "@/components/admin/Paginator";
import { api } from "@/lib/api/client";

const PAGE_SIZE = 25;

const searchSchema = z.object({
  client: z.string().optional(),
});

export const Route = createFileRoute("/admin/clients/")({
  validateSearch: zodValidator(searchSchema),
  component: ClientsList,
});

function ClientsList() {
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/admin/clients/" });
  const { client: openClientId } = Route.useSearch();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useQuery({
    queryKey: ["clients", page, q],
    queryFn: () => api.clients.list({ q: q || undefined, page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  // Fetch a full (unpaginated) list of subscriptions just for the inline badge —
  // limited to 100 to avoid a heavy request.
  const { data: subsResult } = useQuery({
    queryKey: ["subscriptions", "all100"],
    queryFn: () => api.subscriptions.list({ limit: 100 }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.clients.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted");
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to delete client"),
  });

  const clients = result?.data ?? [];
  const total = result?.total ?? 0;
  const subs = subsResult?.data ?? [];

  // Index latest sub per client
  const latestSub = (clientId: string) => {
    const matching = subs.filter((s) => s.clientId === clientId);
    if (!matching.length) return undefined;
    return [...matching].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
  };

  // Reset to page 1 when search query changes
  const handleSearch = (v: string) => {
    setQ(v);
    setPage(1);
  };

  const openClient = (id: string) =>
    navigate({ search: (prev: any) => ({ ...prev, client: id }), replace: false });
  const closeClient = () =>
    navigate({
      search: (prev: any) => {
        const { client: _, ...rest } = prev;
        return rest;
      },
      replace: false,
    });

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
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} rows={6} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users2 className="h-5 w-5" />}
          title={q ? "No matches" : "No clients yet"}
          description={
            q
              ? "Try a different name, email, or phone number."
              : "Import a spreadsheet or add clients one at a time."
          }
          action={
            !q ? (
              <Button asChild>
                <Link to="/admin/clients/$id" params={{ id: "new" }}>
                  <Plus className="mr-1 h-4 w-4" /> New client
                </Link>
              </Button>
            ) : undefined
          }
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
              {clients.map((c) => {
                const s = latestSub(c._id);
                return (
                  <TableRow
                    key={c._id}
                    onClick={() => openClient(c._id)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="font-medium">{c.fullName}</div>
                      <div className="text-xs text-muted-foreground">{c.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{c.email}</TableCell>
                    <TableCell className="text-xs uppercase text-muted-foreground">
                      {c.source}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s?.plan ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {s ? (
                        <SubStatusBadge status={s.status} />
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ClientStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/admin/clients/$id" params={{ id: c._id }}>
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => confirm(`Delete "${c.fullName}"?`) && del.mutate(c._id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="px-4 pb-3">
            <Paginator page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
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
