import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, FileText, Upload } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Paginator } from "@/components/admin/Paginator";
import { api } from "@/lib/api/client";
import type { DocumentVisibility } from "@/lib/api/types";

const PAGE_SIZE = 20;

const CATEGORY_OPTIONS = [
  { value: "receipt", label: "Receipt" },
  { value: "offer_letter", label: "Offer letter" },
  { value: "title_deed", label: "Title deed" },
  { value: "allocation", label: "Allocation letter" },
  { value: "survey", label: "Survey document" },
  { value: "other", label: "Other" },
];

export const Route = createFileRoute("/admin/documents/")({
  component: AdminDocuments,
});

function AdminDocuments() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<DocumentVisibility>("immediate");
  const [milestoneName, setMilestoneName] = useState("");
  const [category, setCategory] = useState("receipt");

  const { data: result } = useQuery({
    queryKey: ["documents", page],
    queryFn: () => api.documents.list({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const { data: subsResult } = useQuery({
    queryKey: ["subscriptions", "all"],
    queryFn: () => api.subscriptions.list({ limit: 200 }),
  });

  const { data: clientsResult } = useQuery({
    queryKey: ["clients", "all"],
    queryFn: () => api.clients.list({ limit: 200 }),
  });

  const docs = result?.data ?? [];
  const total = result?.total ?? 0;
  const subs = subsResult?.data ?? [];
  const clients = clientsResult?.data ?? [];

  const upload = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error("No file selected");
      const vis = visibility.startsWith("on_milestone:")
        ? (`on_milestone:${milestoneName || "custom"}` as DocumentVisibility)
        : visibility;
      return api.documents.upload({
        subscriptionId,
        label,
        visibility: vis,
        category,
        file: selectedFile,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded");
      setOpen(false);
      setLabel("");
      setSelectedFile(null);
      setCategory("receipt");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.documents.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Deleted");
    },
  });

  const subLabel = (id: string) => {
    const s = subs.find((x) => x._id === id || x.id === id);
    if (!s) return "—";
    const c = clients.find((x) => x._id === s.clientId);
    return `${c?.fullName ?? "?"} — ${s.plan}`;
  };

  const fileUrl = (d: any) => d.fileUrl ?? d.cachedUrl ?? "#";

  return (
    <div>
      <PageHeader
        title="Subscriber documents"
        description="Upload receipts, allocation letters and title documents. Visibility controls when subscribers can access each file."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Add document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subscription</Label>
                  <Select value={subscriptionId} onValueChange={setSubscriptionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subscription…" />
                    </SelectTrigger>
                    <SelectContent>
                      {subs.map((s) => (
                        <SelectItem key={s._id ?? s.id} value={s._id ?? s.id}>
                          {subLabel(s._id ?? s.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Offer letter, Receipt, Title deed…"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <div
                    className="flex cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed border-border p-4 hover:bg-muted/40"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to choose PDF or image (max 20 MB)"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={visibility.startsWith("on_milestone:") ? "on_milestone:" : visibility}
                    onValueChange={(v) => setVisibility(v as DocumentVisibility)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Visible immediately</SelectItem>
                      <SelectItem value="on_full_payment">On full payment</SelectItem>
                      <SelectItem value="on_milestone:">On custom milestone…</SelectItem>
                    </SelectContent>
                  </Select>
                  {visibility.startsWith("on_milestone") && (
                    <Input
                      placeholder="Milestone name"
                      value={milestoneName}
                      onChange={(e) => setMilestoneName(e.target.value)}
                    />
                  )}
                </div>
                <Button
                  onClick={() => upload.mutate()}
                  disabled={!subscriptionId || !label || !selectedFile || upload.isPending}
                  className="w-full"
                >
                  {upload.isPending ? "Uploading…" : "Upload to Cloudinary"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-3">
        {docs.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">{d.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {subLabel(d.subscriptionId)} · Uploaded {format(new Date(d.uploadedAt), "PP")}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{d.visibility}</Badge>
                    {(d as any).category && (
                      <Badge variant="secondary" className="text-xs">
                        {(d as any).category}
                      </Badge>
                    )}
                    <a
                      href={fileUrl(d)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground underline"
                    >
                      Open file
                    </a>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove.mutate(d.id)}
                disabled={remove.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {docs.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No documents yet. Upload a file to get started.
            </CardContent>
          </Card>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-4">
          <Paginator page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
