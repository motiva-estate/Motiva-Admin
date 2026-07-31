import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableSkeleton } from "@/components/admin/Skeletons";
import { Mail } from "lucide-react";
import { EnquiryStatusBadge } from "@/components/admin/StatusBadges";
import { Paginator } from "@/components/admin/Paginator";
import { api } from "@/lib/api/client";
import type { EnquiryStatus } from "@/lib/api/types";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/admin/enquiries/")({
  component: EnquiriesList,
});

function EnquiriesList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: result, isLoading } = useQuery({
    queryKey: ["enquiries", page],
    queryFn: () => api.enquiries.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users.list(),
  });

  const { data: properties } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
  });

  const update = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<{ status: EnquiryStatus; assignedToId: string | undefined }>;
    }) => api.enquiries.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enquiries"] });
      toast.success("Updated");
    },
  });

  const enquiries = result?.data ?? [];
  const total = result?.total ?? 0;

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Site enquiries feed straight in — assign, qualify, and convert."
      />
      {isLoading ? (
        <TableSkeleton columns={6} rows={5} />
      ) : enquiries.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-5 w-5" />}
          title="No enquiries yet"
          description="They'll appear here as they arrive from the public site."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.email}</div>
                  </TableCell>
                  <TableCell className="max-w-sm text-sm text-muted-foreground">
                    <div className="line-clamp-2">{e.message}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {properties?.find((p) => p.id === e.propertyId)?.title ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={e.assignedToId ?? "__none"}
                      onValueChange={(v) =>
                        update.mutate({
                          id: e.id,
                          patch: { assignedToId: v === "__none" ? undefined : v },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Unassigned</SelectItem>
                        {users?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <EnquiryStatusBadge status={e.status} />
                      <Select
                        value={e.status}
                        onValueChange={(v) =>
                          update.mutate({ id: e.id, patch: { status: v as EnquiryStatus } })
                        }
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">New</SelectItem>
                          <SelectItem value="CONTACTED">Contacted</SelectItem>
                          <SelectItem value="QUALIFIED">Qualified</SelectItem>
                          <SelectItem value="CONVERTED">Converted</SelectItem>
                          <SelectItem value="LOST">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(e.createdAt), "MMM d, p")}
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
