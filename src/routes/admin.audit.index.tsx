import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
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
import { TableSkeleton } from "@/components/admin/Skeletons";
import { Paginator } from "@/components/admin/Paginator";
import { ScrollText } from "lucide-react";
import { api } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 30;

export const Route = createFileRoute("/admin/audit/")({
  component: AuditPage,
});

function AuditPage() {
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useQuery({
    queryKey: ["auditLog", page],
    queryFn: () => api.auditLog.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const entries = result?.data ?? [];
  const total = result?.total ?? 0;

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every create, update, delete, publish, and role change."
      />
      {isLoading ? (
        <TableSkeleton columns={4} rows={6} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-5 w-5" />}
          title="No entries yet"
          description="Actions across the admin appear here as they happen."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(a.createdAt), "MMM d, p")}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{a.actorName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.entityType} <span className="text-muted-foreground">· {a.entityId}</span>
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
