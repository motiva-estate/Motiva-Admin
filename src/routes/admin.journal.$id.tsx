import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { useDirty } from "@/lib/use-dirty";
import type { ContentStatus, SanityJournalEntry } from "@/lib/api/types";

export const Route = createFileRoute("/admin/journal/$id")({
  component: JournalEditor,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function JournalEditor() {
  const { id } = useParams({ from: "/admin/journal/$id" });
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();

  const { data: existing } = useQuery({
    queryKey: ["journal", id],
    queryFn: () => api.journal.get(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState<Partial<SanityJournalEntry>>({
    title: "",
    slug: "",
    category: "",
    excerpt: "",
    publishedAt: "",
    readingTime: "",
    coverUrl: "",
    body: "",
    order: 0,
    status: "DRAFT",
  });

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const { isDirty, markClean } = useDirty(form, isNew ? null : (existing ?? null));

  const canPublish = can("content.publish");

  const save = useMutation({
    mutationFn: () => {
      if (isNew) return api.journal.create(form);
      return api.journal.update(id, form);
    },
    onSuccess: (entry) => {
      markClean();
      toast.success(isNew ? "Entry created" : "Saved");
      qc.invalidateQueries({ queryKey: ["journal"] });
      if (isNew) navigate({ to: "/admin/journal/$id", params: { id: entry.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: () => api.journal.remove(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["journal"] });
      navigate({ to: "/admin/journal" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="max-w-full space-y-6">
      <PageHeader
        title={isNew ? "New journal entry" : form.title || "Edit entry"}
        description="Saved to Sanity and published on the public site."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/journal" })}>
              Back
            </Button>
            {!isNew && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => confirm("Delete this entry?") && del.mutate()}
                disabled={del.isPending}
              >
                {del.isPending ? "Deleting…" : "Delete"}
              </Button>
            )}
            <Button onClick={() => save.mutate()} disabled={save.isPending || !isDirty}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      />

      {/* Meta */}
      <Card>
        <CardHeader>
          <CardTitle>Meta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    slug: isNew || !f.slug ? slugify(e.target.value) : f.slug,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                placeholder="e.g. Market Insights"
                value={form.category ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Published date</Label>
              <Input
                type="date"
                value={form.publishedAt?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    publishedAt: e.target.value ? new Date(e.target.value).toISOString() : "",
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Reading time</Label>
              <Input
                placeholder="e.g. 4 min read"
                value={form.readingTime ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, readingTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status ?? "DRAFT"}
                onValueChange={(v) => {
                  const next = v as ContentStatus;
                  if (next === "PUBLISHED" && !canPublish) {
                    toast.error("Only Administrators can publish.");
                    return;
                  }
                  setForm((f) => ({ ...f, status: next }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="REVIEW">In Review</SelectItem>
                  <SelectItem value="PUBLISHED" disabled={!canPublish}>
                    Published
                  </SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={form.order ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Excerpt</Label>
            <Textarea
              rows={2}
              placeholder="Short description shown in listing views (1–2 sentences)."
              value={form.excerpt ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            />
          </div>

          <CloudinaryUpload
            label="Cover image"
            value={form.coverUrl ?? ""}
            onChange={(url) => setForm((f) => ({ ...f, coverUrl: url }))}
            accept="image/*"
            category="update_photo"
          />
        </CardContent>
      </Card>

      {/* Body */}
      <Card>
        <CardHeader>
          <CardTitle>Body</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={20}
            placeholder="Write the full article here. Markdown is supported by the frontend renderer."
            value={form.body ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="font-mono text-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Markdown supported — headings, bold, lists, links.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
