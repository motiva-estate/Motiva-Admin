import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CollectionAdmin } from "@/components/admin/CollectionAdmin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from "@/lib/api/client";
import type { Achievement, LeadershipEntry } from "@/lib/api/types";
import { PageHeader } from "@/components/admin/PageHeader";

export const Route = createFileRoute("/admin/team/")({
  component: TeamPage,
});

function TeamPage() {
  const [tab, setTab] = useState("leadership");
  return (
    <div>
      <PageHeader title="Team & Milestones" description="Leadership bios and company achievements." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        <TabsContent value="leadership" className="mt-4">
          <CollectionAdmin<LeadershipEntry>
            title=""
            queryKey="leadership"
            fetcher={() => api.leadership.list()}
            creator={(i) => api.leadership.create(i)}
            updater={(id, p) => api.leadership.update(id, p)}
            remover={(id) => api.leadership.remove(id)}
            emptyPrompt="Add the first leadership bio."
            defaults={{ name: "", role: "", bio: "", order: 0 }}
            columns={[
              { header: "Name", render: (r) => <div className="font-medium">{r.name}</div> },
              { header: "Role", render: (r) => r.role },
              { header: "Order", render: (r) => r.order ?? 0 },
            ]}
            renderForm={(form, setForm) => (
              <>
                <div className="space-y-2"><Label>Name</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Role</Label><Input value={form.role ?? ""} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
                <div className="space-y-2"><Label>Bio</Label><Textarea rows={3} value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
                <div className="space-y-2"><Label>Photo URL</Label><Input value={form.photoUrl ?? ""} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} /></div>
                <div className="space-y-2"><Label>Order</Label><Input type="number" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
              </>
            )}
          />
        </TabsContent>
        <TabsContent value="achievements" className="mt-4">
          <CollectionAdmin<Achievement>
            title=""
            queryKey="achievements"
            fetcher={() => api.achievements.list()}
            creator={(i) => api.achievements.create(i)}
            updater={(id, p) => api.achievements.update(id, p)}
            remover={(id) => api.achievements.remove(id)}
            emptyPrompt="Log a company milestone or award."
            defaults={{ title: "", description: "", year: new Date().getFullYear(), order: 0 }}
            columns={[
              { header: "Title", render: (r) => <div className="font-medium">{r.title}</div> },
              { header: "Year", render: (r) => r.year ?? "—" },
              { header: "Order", render: (r) => r.order ?? 0 },
            ]}
            renderForm={(form, setForm) => (
              <>
                <div className="space-y-2"><Label>Title</Label><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Year</Label><Input type="number" value={form.year ?? new Date().getFullYear()} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></div>
                  <div className="space-y-2"><Label>Order</Label><Input type="number" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
                </div>
              </>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
