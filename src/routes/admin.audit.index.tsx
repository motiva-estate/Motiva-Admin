import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableSkeleton } from "@/components/admin/Skeletons";
import { ScrollText } from "lucide-react";
import { api } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/audit/")({
  component: AuditPage,
});

function AuditPage() {
  const { data, isLoading } = useQuery({ queryKey: ["auditLog"], queryFn: () => api.auditLog.list() });

  return (
    <div>
      <PageHeader title="Audit log" description="Every create, update, delete, publish, and role change." />
      {isLoading ? (
        <TableSkeleton columns={4} rows={6} />
      ) : !data || data.length === 0 ? (
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
              {data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(a.createdAt), "MMM d, p")}</TableCell>
                  <TableCell data-label="Actor" className="text-sm font-medium">{a.actorName}</TableCell>
                  <TableCell data-label="Action"><Badge variant="outline">{a.action}</Badge></TableCell>
                  <TableCell data-label="Entity" className="text-sm">
                    {a.entityType} <span className="text-muted-foreground">· {a.entityId}</span>
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
