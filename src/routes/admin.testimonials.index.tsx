import { createFileRoute } from "@tanstack/react-router";
import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import type { Testimonial } from "@/lib/api/types";
import { ContentStatusBadge } from "@/components/admin/StatusBadges";

export const Route = createFileRoute("/admin/testimonials/")({
  component: TestimonialsPage,
});

function TestimonialsPage() {
  return (
    <CollectionAdmin<Testimonial>
      title="Testimonials"
      description="Client quotes shown across the site."
      queryKey="testimonials"
      fetcher={() => api.testimonials.list()}
      creator={(input) => api.testimonials.create(input)}
      updater={(id, patch) => api.testimonials.update(id, patch)}
      remover={(id) => api.testimonials.remove(id)}
      emptyPrompt="Add your first client quote."
      defaults={{ authorName: "", quote: "", order: 0 }}
      columns={[
        { header: "Author", render: (r) => (
          <div>
            <div className="font-medium">{r.authorName}</div>
            <div className="text-xs text-muted-foreground">{r.authorTitle ?? "—"}</div>
          </div>
        )},
        { header: "Quote", render: (r) => <div className="line-clamp-2 max-w-md text-muted-foreground">{r.quote}</div> },
        { header: "Rating", render: (r) => r.rating ? `${r.rating}/5` : "—" },
        { header: "Order", render: (r) => r.order ?? 0 },
        { header: "Status", render: (r) => <ContentStatusBadge status={r.status} /> },
      ]}
      renderForm={(form, setForm) => (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Author name</Label>
              <Input value={form.authorName ?? ""} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Author title</Label>
              <Input value={form.authorTitle ?? ""} onChange={(e) => setForm({ ...form, authorTitle: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quote</Label>
            <Textarea rows={3} value={form.quote ?? ""} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Rating (1-5)</Label>
              <Input type="number" min={1} max={5} value={form.rating ?? ""} onChange={(e) => setForm({ ...form, rating: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
          </div>
        </>
      )}
    />
  );
}
