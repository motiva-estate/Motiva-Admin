import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "./PageHeader";
import { EmptyState } from "./EmptyState";
import { TableSkeleton } from "./Skeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface CollectionProps<T extends { id: string }> {
  title: string;
  description?: string;
  queryKey: string;
  fetcher: () => Promise<T[]>;
  creator: (input: Partial<T>) => Promise<T>;
  updater: (id: string, patch: Partial<T>) => Promise<T>;
  remover: (id: string) => Promise<void>;
  emptyPrompt: string;
  columns: { header: string; render: (row: T) => ReactNode }[];
  defaults: Partial<T>;
  renderForm: (form: Partial<T>, setForm: (u: Partial<T>) => void) => ReactNode;
}

export function CollectionAdmin<T extends { id: string }>(props: CollectionProps<T>) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: [props.queryKey], queryFn: props.fetcher });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Partial<T>>(props.defaults);

  const openNew = () => { setEditing(null); setForm(props.defaults); setDialogOpen(true); };
  const openEdit = (row: T) => { setEditing(row); setForm(row); setDialogOpen(true); };

  const save = useMutation({
    mutationFn: () => editing ? props.updater(editing.id, form) : props.creator(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [props.queryKey] });
      toast.success(editing ? "Saved" : "Created");
      setDialogOpen(false);
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => props.remover(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [props.queryKey] });
      toast.success("Deleted");
    },
  });

  return (
    <div>
      <PageHeader
        title={props.title}
        description={props.description}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="mr-1 h-4 w-4" /> New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit" : "New"} entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {props.renderForm(form, setForm)}
                <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      {isLoading ? (
        <TableSkeleton columns={props.columns.length + 1} rows={5} />
      ) : !data || data.length === 0 ? (
        <EmptyState title={`Nothing here yet`} description={props.emptyPrompt} />
      ) : (
        <Card className="responsive-table overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {props.columns.map((c) => <th key={c.header} className="px-4 py-2.5">{c.header}</th>)}
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row) => (
                <tr key={row.id}>
                  {props.columns.map((c, i) => (
                    <td
                      key={c.header}
                      data-label={i === 0 ? undefined : c.header}
                      className="px-4 py-3"
                    >
                      {c.render(row)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => confirm("Delete this entry?") && del.mutate(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
