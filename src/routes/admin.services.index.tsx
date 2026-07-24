import { createFileRoute } from "@tanstack/react-router";
import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import type { Service } from "@/lib/api/types";

export const Route = createFileRoute("/admin/services/")({
  component: ServicesPage,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseLines(v: string): string[] {
  return v.split("\n").map((x) => x.trim()).filter(Boolean);
}

function ServicesPage() {
  return (
    <CollectionAdmin<Service>
      title="Services"
      description="Fields mirror the Sanity `service` schema."
      queryKey="services"
      fetcher={() => api.services.list()}
      creator={(i) => api.services.create(i)}
      updater={(id, p) => api.services.update(id, p)}
      remover={(id) => api.services.remove(id)}
      emptyPrompt="Add a first service line."
      defaults={{ number: "", title: "", slug: "", lede: "", body: "", items: [], icon: "", order: 0 }}
      columns={[
        { header: "#", render: (r) => r.number ?? "—" },
        { header: "Title", render: (r) => (
          <div>
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-muted-foreground">/{r.slug}</div>
          </div>
        )},
        { header: "Lede", render: (r) => <span className="line-clamp-2 text-sm text-muted-foreground">{r.lede}</span> },
        { header: "Order", render: (r) => r.order ?? 0 },
      ]}
      renderForm={(form, setForm) => (
        <>
          <div className="grid grid-cols-[80px_1fr_1fr] gap-3">
            <div className="space-y-2">
              <Label>Number</Label>
              <Input placeholder="01" value={form.number ?? ""} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Lede (short bold intro)</Label>
            <Textarea rows={2} value={form.lede ?? ""} onChange={(e) => setForm({ ...form, lede: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea rows={5} value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>List items (one per line)</Label>
            <Textarea rows={4} value={(form.items ?? []).join("\n")} onChange={(e) => setForm({ ...form, items: parseLines(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Icon (lucide name)</Label>
              <Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
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
