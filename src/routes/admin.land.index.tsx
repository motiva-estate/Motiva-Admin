import { createFileRoute } from "@tanstack/react-router";
import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { api } from "@/lib/api/client";
import type { Land } from "@/lib/api/types";

export const Route = createFileRoute("/admin/land/")({
  component: LandPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseSizes(v: string): number[] {
  return v
    .split(/[,\s]+/)
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function parseAmenities(v: string): string[] {
  return v
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function LandPage() {
  return (
    <CollectionAdmin<Land>
      title="Land parcels"
      description="Estate land offerings — Sanity-backed."
      queryKey="land"
      fetcher={() => api.land.list()}
      creator={(i) => api.land.create(i)}
      updater={(id, p) => api.land.update(id, p)}
      remover={(id) => api.land.remove(id)}
      emptyPrompt="Add a land parcel to publish on the site."
      defaults={{
        name: "",
        slug: "",
        location: "",
        estate: "",
        status: "available",
        sizes: [],
        description: "",
        estateAmenities: [],
        galleryUrls: [],
      }}
      columns={[
        {
          header: "Name",
          render: (r) => (
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.location}</div>
            </div>
          ),
        },
        { header: "Estate", render: (r) => r.estate ?? "—" },
        {
          header: "Sizes",
          render: (r) => (r.sizes?.length ? r.sizes.map((s) => `${s}sqm`).join(", ") : "—"),
        },
        {
          header: "Status",
          render: (r) => (
            <Badge variant={r.status === "available" ? "default" : "secondary"}>{r.status}</Badge>
          ),
        },
      ]}
      renderForm={(form, setForm) => (
        <>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => {
                const name = e.target.value;
                setForm({ ...form, name, slug: form.slug || slugify(name) });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={form.slug ?? ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={form.location ?? ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estate</Label>
              <Input
                value={form.estate ?? ""}
                onChange={(e) => setForm({ ...form, estate: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status ?? "available"}
                onValueChange={(v) => setForm({ ...form, status: v as Land["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-nowrap">Sizes(sqm, comma-sep'd)</Label>
              <Input
                value={(form.sizes ?? []).join(", ")}
                onChange={(e) => setForm({ ...form, sizes: parseSizes(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Estate amenities (one per line)</Label>
            <Textarea
              rows={4}
              value={(form.estateAmenities ?? []).join("\n")}
              onChange={(e) =>
                setForm({ ...form, estateAmenities: parseAmenities(e.target.value) })
              }
            />
          </div>
          <CloudinaryUpload
            label="Cover image"
            value={form.coverUrl ?? form.coverImageUrl ?? ""}
            onChange={(url) => setForm({ ...form, coverUrl: url })}
            accept="image/*"
            category="update_photo"
          />
          {/* Gallery — stored as galleryUrls: string[] on the Land document */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Gallery images</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setForm({ ...form, galleryUrls: [...(form.galleryUrls ?? []), ""] })}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {(form.galleryUrls ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">No gallery images yet.</p>
            )}
            {(form.galleryUrls ?? []).map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <CloudinaryUpload
                  value={url}
                  onChange={(u) =>
                    setForm({
                      ...form,
                      galleryUrls: (form.galleryUrls ?? []).map((v, idx) => (idx === i ? u : v)),
                    })
                  }
                  accept="image/*"
                  category="update_photo"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  onClick={() =>
                    setForm({
                      ...form,
                      galleryUrls: (form.galleryUrls ?? []).filter((_, idx) => idx !== i),
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    />
  );
}
