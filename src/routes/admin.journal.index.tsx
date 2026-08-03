import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, BookOpen } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/EmptyState";
import { TableSkeleton } from "@/components/admin/Skeletons";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/admin/journal/")({
  component: JournalList,
});

function JournalList() {
  const { data, isLoading } = useQuery({
    queryKey: ["journal"],
    queryFn: () => api.journal.list(),
  });

  return (
    <div>
      <PageHeader
        title="Journal"
        description="Blog posts and articles published on the Motiva website."
        actions={
          <Button asChild>
            <Link to="/admin/journal/$id" params={{ id: "new" }}>
              <Plus className="mr-1 h-4 w-4" /> New entry
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton columns={5} rows={5} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="No journal entries yet"
          description="Create the first article to start publishing on the site."
          action={
            <Button asChild>
              <Link to="/admin/journal/$id" params={{ id: "new" }}>
                <Plus className="mr-1 h-4 w-4" /> New entry
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
                <TableHead>Category</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Reading time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-medium">{entry.title}</div>
                    {entry.excerpt && (
                      <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {entry.excerpt}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.publishedAt ? format(new Date(entry.publishedAt), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.readingTime ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.status === "PUBLISHED" ? "default" : "secondary"}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/admin/journal/$id" params={{ id: entry.id }}>
                        Edit
                      </Link>
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
