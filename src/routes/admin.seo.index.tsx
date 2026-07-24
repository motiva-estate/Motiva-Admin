import { createFileRoute } from "@tanstack/react-router";
import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import type { SEOMetadata } from "@/lib/api/types";

export const Route = createFileRoute("/admin/seo/")({
  component: SeoPage,
});

function SeoPage() {
  return (
    <CollectionAdmin<SEOMetadata>
      title="SEO Metadata"
      description="Per-page and per-content titles, descriptions, and Open Graph images."
      queryKey="seo"
      fetcher={() => api.seo.list()}
      creator={(i) => api.seo.create(i)}
      updater={(id, p) => api.seo.update(id, p)}
      remover={(id) => api.seo.remove(id)}
      emptyPrompt="Configure SEO for a page or content item."
      defaults={{ pageKey: "", title: "", description: "" }}
      columns={[
        { header: "Target", render: (r) => r.pageKey ?? r.projectId ?? r.propertyId ?? "—" },
        { header: "Title", render: (r) => <div className="font-medium">{r.title}</div> },
        { header: "Description", render: (r) => <div className="line-clamp-1 max-w-md text-muted-foreground">{r.description}</div> },
      ]}
      renderForm={(form, setForm) => (
        <>
          <div className="space-y-2"><Label>Page key (e.g. home, about)</Label><Input value={form.pageKey ?? ""} onChange={(e) => setForm({ ...form, pageKey: e.target.value })} /></div>
          <div className="space-y-2"><Label>Title</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="space-y-2"><Label>OG image URL</Label><Input value={form.ogImageUrl ?? ""} onChange={(e) => setForm({ ...form, ogImageUrl: e.target.value })} /></div>
          <div className="space-y-2"><Label>Canonical URL</Label><Input value={form.canonicalUrl ?? ""} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} /></div>
        </>
      )}
    />
  );
}
