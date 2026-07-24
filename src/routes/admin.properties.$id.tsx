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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import type {
  ContentStatus,
  Property,
  SanityProjectStatus,
  SanityPropertyType,
} from "@/lib/api/types";

export const Route = createFileRoute("/admin/properties/$id")({
  component: PropertyEditor,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const PROPERTY_TYPES: SanityPropertyType[] = ["Villa", "Apartment", "Townhouse", "Penthouse"];
const PROJECT_STATUSES: SanityProjectStatus[] = ["pre-sale", "ongoing", "delivered"];

function PropertyEditor() {
  const { id } = useParams({ from: "/admin/properties/$id" });
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, can } = useAuth();

  const { data: existing } = useQuery({
    queryKey: ["property", id],
    queryFn: () => api.properties.get(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState<Partial<Property>>({
    title: "",
    slug: "",
    tagline: "",
    description: "",
    location: "",
    city: "",
    type: "Villa",
    projectStatus: "pre-sale",
    phaseLabel: "",
    buildingType: "",
    amenities: [],
    nearby: [],
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

  const canPublish = can("content.publish");

  const save = useMutation({
    mutationFn: async () => {
      const payload: Partial<Property> = {
        ...form,
        amenities: amenitiesText.split("\n").map((s) => s.trim()).filter(Boolean),
        nearby: nearbyText.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      if (isNew) return api.properties.create({ ...payload, createdById: user!.id });
      return api.properties.update(id, payload);
    },
    onSuccess: (p) => {
      toast.success(isNew ? "Property created" : "Saved");
      qc.invalidateQueries({ queryKey: ["properties"] });
      if (isNew) navigate({ to: "/admin/properties/$id", params: { id: p.id } });
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={isNew ? "New property" : form.title || "Property"}
        description="Fields mirror the Sanity `project` schema."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/properties" })}>Back</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: isNew || !f.slug ? slugify(e.target.value) : f.slug }))} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug ?? ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={form.tagline ?? ""} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={5} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location ?? ""} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.city ?? ""} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cover image URL (external)</Label>
              <Input value={form.coverUrl ?? ""} onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Coords</Label>
              <Input value={form.coords ?? ""} onChange={(e) => setForm((f) => ({ ...f, coords: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Listing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type ?? "Villa"} onValueChange={(v) => setForm((f) => ({ ...f, type: v as SanityPropertyType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project status</Label>
              <Select value={form.projectStatus ?? "pre-sale"} onValueChange={(v) => setForm((f) => ({ ...f, projectStatus: v as SanityProjectStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phase label</Label>
              <Input value={form.phaseLabel ?? ""} onChange={(e) => setForm((f) => ({ ...f, phaseLabel: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Building type</Label>
              <Input value={form.buildingType ?? ""} onChange={(e) => setForm((f) => ({ ...f, buildingType: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Beds</Label>
              <Input type="number" value={form.bedrooms ?? ""} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-2">
              <Label>Baths</Label>
              <Input type="number" value={form.bathrooms ?? ""} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={form.order ?? 0} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-end gap-3">
              <Switch id="priceInternal" checked={!!form.isPriceInternal} onCheckedChange={(v) => setForm((f) => ({ ...f, isPriceInternal: v }))} />
              <Label htmlFor="priceInternal">Price internal</Label>
            </div>
            <div className="flex items-end gap-3">
              <Switch id="featured" checked={!!form.featured} onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))} />
              <Label htmlFor="featured">Featured</Label>
            </div>
            <div className="space-y-2">
              <Label>Content status</Label>
              <Select value={form.status} onValueChange={(v) => {
                const next = v as ContentStatus;
                if (next === "PUBLISHED" && !canPublish) { toast.error("Only Administrators can publish."); return; }
                setForm((f) => ({ ...f, status: next }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED" disabled={!canPublish}>Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
        <CardContent>
          <Label>One per line</Label>
          <Textarea rows={6} value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Nearby</CardTitle></CardHeader>
        <CardContent>
          <Label>One place per line</Label>
          <Textarea rows={5} value={nearbyText} onChange={(e) => setNearbyText(e.target.value)} />
        </CardContent>
      </Card>
    </div>
  );
}
