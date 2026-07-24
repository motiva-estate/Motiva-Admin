import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api/client";
import { ListSkeleton } from "@/components/admin/Skeletons";
import { EmptyState } from "@/components/admin/EmptyState";
import type { HomepageSection } from "@/lib/api/types";

export const Route = createFileRoute("/admin/homepage/")({
  component: HomepagePage,
});

function HomepagePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["homepageSections"], queryFn: () => api.homepageSections.list() });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<HomepageSection> }) => api.homepageSections.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homepageSections"] }),
  });

  const sorted = [...(data ?? [])].sort((a, b) => a.order - b.order);

  const move = (i: number, dir: -1 | 1) => {
    const target = sorted[i + dir];
    if (!target) return;
    const self = sorted[i];
    update.mutate({ id: self.id, patch: { order: target.order } });
    update.mutate({ id: target.id, patch: { order: self.order } });
    toast.success("Reordered");
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Homepage sections" description="Toggle visibility and reorder blocks without a deploy." />
      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : sorted.length === 0 ? (
        <EmptyState title="No homepage sections" description="Sections will appear here once configured." />
      ) : (
        <Card className="divide-y divide-border">
          {sorted.map((s, i) => (
            <div key={s.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">key: {s.key}</div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={s.isVisible} onCheckedChange={(v) => update.mutate({ id: s.id, patch: { isVisible: v } })} />
                <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" disabled={i === sorted.length - 1} onClick={() => move(i, 1)}><ChevronDown className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
