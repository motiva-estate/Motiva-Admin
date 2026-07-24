import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, FileText } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import type { DocumentVisibility } from "@/lib/api/types";

export const Route = createFileRoute("/admin/documents/")({
  component: AdminDocuments,
});

function AdminDocuments() {
  const qc = useQueryClient();
  const { data: docs } = useQuery({ queryKey: ["documents"], queryFn: () => api.documents.list() });
  const { data: subs } = useQuery({ queryKey: ["subscriptions"], queryFn: () => api.subscriptions.list() });
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: () => api.clients.list() });

  const [open, setOpen] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [visibility, setVisibility] = useState<DocumentVisibility>("immediate");
  const [milestoneName, setMilestoneName] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.documents.create({
        subscriptionId,
        label,
        fileUrl,
        visibility: visibility === "on_milestone:" ? (`on_milestone:${milestoneName || "custom"}` as DocumentVisibility) : visibility,
        uploadedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document added");
      setOpen(false);
      setLabel("");
      setFileUrl("");
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.documents.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const subLabel = (id: string) => {
    const s = subs?.find((x) => x.id === id);
    if (!s) return "—";
    const c = clients?.find((x) => x.id === s.clientId);
    return `${c?.fullName ?? "?"} — ${s.plan}`;
  };

  return (
    <div>
      <PageHeader
        title="Subscriber documents"
        description="Attach receipts, allocation letters and title documents against a subscription. Set visibility to control when the subscriber can see each file."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> Add document</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add document</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subscription</Label>
                  <Select value={subscriptionId} onValueChange={setSubscriptionId}>
                    <SelectTrigger><SelectValue placeholder="Select a subscription…" /></SelectTrigger>
                    <SelectContent>
                      {subs?.map((s) => <SelectItem key={s.id} value={s.id}>{subLabel(s.id)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Offer letter, Receipt, Title deed…" />
                </div>
                <div className="space-y-2">
                  <Label>File URL</Label>
                  <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://…" />
                  <p className="text-xs text-muted-foreground">In production this will accept a file upload and store it behind signed URLs.</p>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={visibility.startsWith("on_milestone:") ? "on_milestone:" : visibility} onValueChange={(v) => setVisibility(v as DocumentVisibility)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Visible immediately</SelectItem>
                      <SelectItem value="on_full_payment">On full payment</SelectItem>
                      <SelectItem value="on_milestone:">On custom milestone…</SelectItem>
                    </SelectContent>
                  </Select>
                  {visibility.startsWith("on_milestone") && (
                    <Input placeholder="Milestone name (e.g. survey)" value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} />
                  )}
                </div>
                <Button onClick={() => create.mutate()} disabled={!subscriptionId || !label || !fileUrl || create.isPending}>
                  {create.isPending ? "Saving…" : "Add document"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="space-y-3">
        {docs?.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">{d.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {subLabel(d.subscriptionId)} · Uploaded {format(new Date(d.uploadedAt), "PP")}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">{d.visibility}</Badge>
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">
                      Open file
                    </a>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(d.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {docs && docs.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No documents yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}