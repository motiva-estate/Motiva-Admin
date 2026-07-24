import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star } from "lucide-react";
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
import { Building2 } from "lucide-react";
import { ContentStatusBadge } from "@/components/admin/StatusBadges";
import { api } from "@/lib/api/client";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/projects/")({
  component: ProjectsList,
});

function ProjectsList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.projects.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
  });

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Signature developments. Draft → Review → Publish."
        actions={
          <Button asChild>
            <Link to="/admin/projects/new">
              <Plus className="mr-1 h-4 w-4" /> New project
            </Link>
          </Button>
        }
      />
      {isLoading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="No projects yet"
          description="Create the first project to start building your catalog."
          action={
            <Button asChild>
              <Link to="/admin/projects/new">Create project</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {p.featured && (
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      )}
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell data-label="Location" className="text-sm">
                    {p.location}, {p.city}
                  </TableCell>
                  <TableCell data-label="Status">
                    <ContentStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell data-label="Updated" className="text-sm text-muted-foreground">
                    {format(new Date(p.updatedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/admin/projects/$id" params={{ id: p.id }}>
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
