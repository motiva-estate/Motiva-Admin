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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import type {
  ContentStatus,
  Project,
  SanityProjectStatus,
  SanityPropertyType,
} from "@/lib/api/types";

export const Route = createFileRoute("/admin/projects/$id")({
  component: ProjectEditor,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const PROPERTY_TYPES: SanityPropertyType[] = ["Villa", "Apartment", "Townhouse", "Penthouse"];
const PROJECT_STATUSES: SanityProjectStatus[] = ["pre-sale", "ongoing", "delivered"];

function ProjectEditor() {
  const { id } = useParams({ from: "/admin/projects/$id" });
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, can } = useAuth();

  const { data: existing } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.projects.get(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState<Partial<Project>>({
    title: "",
    slug: "",
    tagline: "",
    description: "",
    location: "",
    city: "",
    propertyType: "Villa",
    projectStatus: "pre-sale",
    phaseLabel: "",
    buildingType: "",
    amenities: [],
    nearby: [],
    faq: [],
    isPriceInternal: true,
    featured: false,
    order: 0,
    status: "DRAFT",
  });
  const [amenitiesText, setAmenitiesText] = useState("");
  const [nearbyText, setNearbyText] = useState("");

  useEffect(() => {
    if (existing) {
      setForm(existing);
      setAmenitiesText((existing.amenities ?? []).join("\n"));
      setNearbyText((existing.nearby ?? []).join("\n"));
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Partial<Project> = {
        ...form,
        amenities: amenitiesText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        nearby: nearbyText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (isNew) return api.projects.create({ ...payload, createdById: user!.id });
      return api.projects.update(id, payload);
    },
    onSuccess: (p) => {
      toast.success(isNew ? "Project created" : "Saved");
      qc.invalidateQueries({ queryKey: ["projects"] });
      if (isNew) navigate({ to: "/admin/projects/$id", params: { id: p.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const canPublish = can("content.publish");
  const faq = form.faq ?? [];

  const addFaq = () => setForm((f) => ({ ...f, faq: [...(f.faq ?? []), { q: "", a: "" }] }));
  const setFaq = (i: number, patch: Partial<{ q: string; a: string }>) => {
    const next = [...faq];
    next[i] = { ...next[i], ...patch };
    setForm((f) => ({ ...f, faq: next }));
  };
  const removeFaq = (i: number) =>
    setForm((f) => ({ ...f, faq: (f.faq ?? []).filter((_, x) => x !== i) }));

  return (
    <div className="max-w-full space-y-6">
      <PageHeader
        title={isNew ? "New project" : form.title || "Project"}
        description="Fields mirror the Sanity `project` schema."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/projects" })}>
              Back
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
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
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              value={form.tagline ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={5}
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={form.location ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CloudinaryUpload
              label="Cover image"
              value={form.coverUrl ?? ""}
              onChange={(url) => setForm((f) => ({ ...f, coverUrl: url }))}
              accept="image/*"
              category="update_photo"
            />
            <div className="space-y-2">
              <Label>Coords</Label>
              <Input
                placeholder="N 6°26′ · E 3°26′"
                value={form.coords ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, coords: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Property type</Label>
              <Select
                value={form.propertyType ?? "Villa"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, propertyType: v as SanityPropertyType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project status</Label>
              <Select
                value={form.projectStatus ?? "pre-sale"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, projectStatus: v as SanityProjectStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phase label</Label>
              <Input
                placeholder="Phase 1"
                value={form.phaseLabel ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phaseLabel: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Building type</Label>
              <Input
                value={form.buildingType ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, buildingType: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Beds</Label>
              <Input
                type="number"
                value={form.bedrooms ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bedrooms: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Baths</Label>
              <Input
                type="number"
                value={form.bathrooms ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bathrooms: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-end gap-3">
              <Switch
                id="priceInternal"
                checked={!!form.isPriceInternal}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isPriceInternal: v }))}
              />
              <Label htmlFor="priceInternal">Price internal</Label>
            </div>
            <div className="flex items-end gap-3">
              <Switch
                id="featured"
                checked={!!form.featured}
                onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
              />
              <Label htmlFor="featured">Featured</Label>
            </div>
            <div className="space-y-2">
              <Label>Content status</Label>
              <Select
                value={form.status}
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
                  <SelectItem value="PUBLISHED" disabled={!canPublish}>
                    Published
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>One per line</Label>
          <Textarea
            rows={6}
            value={amenitiesText}
            onChange={(e) => setAmenitiesText(e.target.value)}
            placeholder="Private lap pool&#10;Home cinema"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nearby</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>One place per line</Label>
          <Textarea
            rows={5}
            value={nearbyText}
            onChange={(e) => setNearbyText(e.target.value)}
            placeholder="Ikoyi Golf Club&#10;Landmark Beach"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project FAQ</CardTitle>
          <Button size="sm" variant="outline" onClick={addFaq}>
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {faq.length === 0 && <p className="text-sm text-muted-foreground">No FAQ entries yet.</p>}
          {faq.map((item, i) => (
            <div key={i} className="space-y-2 rounded border border-border p-3">
              <Input
                placeholder="Question"
                value={item.q}
                onChange={(e) => setFaq(i, { q: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="Answer"
                value={item.a}
                onChange={(e) => setFaq(i, { a: e.target.value })}
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => removeFaq(i)}
              >
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
