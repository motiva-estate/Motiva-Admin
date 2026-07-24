import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, Megaphone } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";
import type { ProjectUpdate } from "@/lib/api/types";

export const Route = createFileRoute("/admin/updates/")({
  component: AdminUpdates,
});

function AdminUpdates() {
  const qc = useQueryClient();
  const { data: updates } = useQuery({
    queryKey: ["projectUpdates"],
    queryFn: () => api.projectUpdates.list(),
  });

  const [open, setOpen] = useState(false);
  const [projectRef, setProjectRef] = useState("");
  const [projectRefType, setProjectRefType] = useState<"project" | "land">("project");
  const [text, setText] = useState("");
  const [photosCsv, setPhotosCsv] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.projectUpdates.create({
        projectRef,
        projectRefType,
        text,
        photos: photosCsv.split(",").map((s) => s.trim()).filter(Boolean),
        postedAt: new Date().toISOString(),
      } as Partial<ProjectUpdate>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projectUpdates"] });
      toast.success("Update posted");
      setOpen(false);
      setText("");
      setPhotosCsv("");
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.projectUpdates.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projectUpdates"] }),
  });

  return (
    <div>
      <PageHeader
        title="Project updates"
        description="Post progress notes against a project or land parcel. Every subscriber linked to that ref will see the update in their portal."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> New update</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New project update</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Ref type</Label>
                    <Select value={projectRefType} onValueChange={(v) => setProjectRefType(v as "project" | "land")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="land">Land parcel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ref ID</Label>
                    <Input value={projectRef} onChange={(e) => setProjectRef(e.target.value)} placeholder="project-casa-solano" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Update</Label>
                  <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Structural works on Block B are complete…" />
                </div>
                <div className="space-y-2">
                  <Label>Photo URLs (comma-separated)</Label>
                  <Input value={photosCsv} onChange={(e) => setPhotosCsv(e.target.value)} placeholder="https://…, https://…" />
                </div>
                <Button onClick={() => create.mutate()} disabled={!projectRef || !text || create.isPending}>
                  {create.isPending ? "Posting…" : "Post update"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="space-y-3">
        {updates?.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div className="flex items-start gap-3">
                <Megaphone className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {u.projectRefType} · {u.projectRef} · {format(new Date(u.postedAt), "PP")}
                  </div>
                  <p className="mt-1 text-sm">{u.text}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(u.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {updates && updates.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No updates yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}