import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

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
import { TableSkeleton } from "@/components/admin/Skeletons";
import { Home } from "lucide-react";
import { ContentStatusBadge } from "@/components/admin/StatusBadges";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/admin/properties/")({
  component: PropertiesList,
});


function PropertiesList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => api.properties.list(),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.properties.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      toast.success("Property deleted");
    },
  });

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Individual listings, linked to a project or standalone."
        actions={
          <Button asChild>
            <Link to="/admin/properties/$id" params={{ id: "new" }}>
              <Plus className="mr-1 h-4 w-4" /> New property
            </Link>
          </Button>
        }
      />
      {isLoading ? (
        <TableSkeleton columns={6} rows={5} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Home className="h-5 w-5" />}
          title="No properties yet"
          description="Add listings to publish on the site."
          action={
            <Button asChild>
              <Link to="/admin/properties/$id" params={{ id: "new" }}>
                <Plus className="mr-1 h-4 w-4" /> New property
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Beds / Baths</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.location}, {p.city}
                    </div>
                  </TableCell>
                  <TableCell data-label="Type" className="text-sm">{p.type ?? "—"}</TableCell>
                  <TableCell data-label="Beds / Baths" className="text-sm">
                    {p.bedrooms ?? "—"} / {p.bathrooms ?? "—"}
                  </TableCell>
                  <TableCell data-label="Status">
                    <ContentStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/admin/properties/$id" params={{ id: p.id }}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id);
                      }}
                    >
                      Delete
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
