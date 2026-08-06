import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, Megaphone, ImagePlus } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/admin/updates/")({
  component: AdminUpdates,
});

function AdminUpdates() {
  const qc = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: updatesResult } = useQuery({
    queryKey: ["projectUpdates"],
    queryFn: () => api.projectUpdates.list(),
  });
  const updates = updatesResult?.data ?? [];

  const [open, setOpen] = useState(false);
  const [projectRef, setProjectRef] = useState("");
  const [projectRefType, setProjectRefType] = useState<"project" | "land">("project");
  const [text, setText] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  const create = useMutation({
    mutationFn: () =>
      api.projectUpdates.createWithPhotos({
        projectRef,
        projectRefType,
        text,
        photos: selectedPhotos.length ? selectedPhotos : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projectUpdates"] });
      toast.success("Update posted");
      setOpen(false);
      setText("");
      setSelectedPhotos([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.projectUpdates.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projectUpdates"] });
      toast.success("Update deleted");
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to delete update"),
  });

  return (
    <div>
      <PageHeader
        title="Project updates"
        description="Post progress notes against a project or land parcel. Photos upload directly to Cloudinary. Every subscriber linked to that ref sees the update in their portal in realtime."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> New update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New project update</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Ref type</Label>
                    <Select
                      value={projectRefType}
                      onValueChange={(v) => setProjectRefType(v as "project" | "land")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="land">Land parcel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ref ID</Label>
                    <Input
                      value={projectRef}
                      onChange={(e) => setProjectRef(e.target.value)}
                      placeholder="project-casa-solano"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Update text</Label>
                  <Textarea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Structural works on Block B are complete…"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photos (optional — uploaded to Cloudinary)</Label>
                  <div
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-3 hover:bg-muted/40"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedPhotos.length
                        ? `${selectedPhotos.length} photo${selectedPhotos.length > 1 ? "s" : ""} selected`
                        : "Click to add photos (JPEG/PNG/WebP, max 15 MB each)"}
                    </span>
                    <input
                      ref={photoInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => setSelectedPhotos(Array.from(e.target.files ?? []))}
                    />
                  </div>
                  {selectedPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedPhotos.map((f, i) => (
                        <div key={i} className="relative">
                          <img
                            src={URL.createObjectURL(f)}
                            alt={f.name}
                            className="h-16 w-16 rounded-md object-cover border border-border"
                          />
                          <button
                            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px]"
                            onClick={() =>
                              setSelectedPhotos((prev) => prev.filter((_, j) => j !== i))
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => create.mutate()}
                  disabled={!projectRef || !text || create.isPending}
                  className="w-full"
                >
                  {create.isPending ? "Posting…" : "Post update"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-3">
        {updates.map((u: any) => (
          <Card key={u.id}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div className="flex items-start gap-3">
                <Megaphone className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {u.projectRefType} · {u.projectRef} · {format(new Date(u.postedAt), "PP")}
                  </div>
                  <p className="mt-1 text-sm">{u.text}</p>
                  {u.photos?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(u.photos as string[]).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="h-20 w-20 rounded-md object-cover border border-border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(u._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {updates?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No updates yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
