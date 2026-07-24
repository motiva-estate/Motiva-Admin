import { createFileRoute } from "@tanstack/react-router";
import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import type { FAQ } from "@/lib/api/types";

export const Route = createFileRoute("/admin/faqs/")({
  component: FaqsPage,
});

function FaqsPage() {
  return (
    <CollectionAdmin<FAQ>
      title="FAQs"
      description="Grouped questions surfaced on the FAQ page."
      queryKey="faqs"
      fetcher={() => api.faqs.list()}
      creator={(i) => api.faqs.create(i)}
      updater={(id, p) => api.faqs.update(id, p)}
      remover={(id) => api.faqs.remove(id)}
      emptyPrompt="Add a first question and answer."
      defaults={{ question: "", answer: "", order: 0 }}
      columns={[
        { header: "Question", render: (r) => <div className="font-medium">{r.question}</div> },
        { header: "Category", render: (r) => r.category ?? "—" },
        { header: "Order", render: (r) => r.order ?? 0 },
      ]}
      renderForm={(form, setForm) => (
        <>
          <div className="space-y-2">
            <Label>Question</Label>
            <Input value={form.question ?? ""} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Answer</Label>
            <Textarea rows={4} value={form.answer ?? ""} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
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
