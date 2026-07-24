import { createFileRoute } from "@tanstack/react-router";
import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import type { GalleryItem } from "@/lib/api/types";

export const Route = createFileRoute("/admin/gallery/")({
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <CollectionAdmin<GalleryItem>
      title="Gallery"
      description="Central pool of images tagged by category or linked to a project."
      queryKey="gallery"
      fetcher={() => api.gallery.list()}
      creator={(i) => api.gallery.create(i)}
      updater={(id, p) => api.gallery.update(id, p)}
      remover={(id) => api.gallery.remove(id)}
      emptyPrompt="Add image URLs to build the gallery."
      defaults={{ imageUrl: "", order: 1 }}
      columns={[
        { header: "Preview", render: (r) => (
          r.imageUrl ? <img src={r.imageUrl} alt="" className="h-10 w-16 rounded object-cover" /> : <span className="text-muted-foreground">—</span>
        ) },
        { header: "Caption", render: (r) => r.caption ?? "—" },
        { header: "Category", render: (r) => r.category ?? "—" },
        { header: "Order", render: (r) => r.order },
      ]}
      renderForm={(form, setForm) => (
        <>
          <div className="space-y-2"><Label>Image URL</Label><Input value={form.imageUrl ?? ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
          <div className="space-y-2"><Label>Caption</Label><Input value={form.caption ?? ""} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Category</Label><Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="space-y-2"><Label>Order</Label><Input type="number" value={form.order ?? 1} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
          </div>
        </>
      )}
    />
  );
}
