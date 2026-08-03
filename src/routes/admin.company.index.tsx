import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import { useDirty } from "@/lib/use-dirty";
import { FormSkeleton } from "@/components/admin/Skeletons";
import type { CompanyInfo, CompanyStat } from "@/lib/api/types";

export const Route = createFileRoute("/admin/company/")({
  component: CompanyPage,
});

function CompanyPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["company"], queryFn: () => api.getCompany() });
  const [form, setForm] = useState<Partial<CompanyInfo>>({ stats: [] });
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const { isDirty, markClean } = useDirty(form, data ?? null);

  const save = useMutation({
    mutationFn: () => api.updateCompany(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company"] });
      markClean();
      toast.success("Company info saved");
    },
  });

  const stats = form.stats ?? [];
  const setStat = (i: number, patch: Partial<CompanyStat>) => {
    const next = [...stats];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, stats: next });
  };
  const addStat = () => setForm({ ...form, stats: [...stats, { label: "", value: "" }] });
  const removeStat = (i: number) => setForm({ ...form, stats: stats.filter((_, x) => x !== i) });

  return (
    <div className="max-w-full">
      <PageHeader
        title="Company"
        description="Fields mirror the Sanity `companyInfo` singleton."
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending || !isDirty}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        }
      />
      {isLoading ? (
        <FormSkeleton rows={6} />
      ) : (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Founding year</Label>
                <Input
                  type="number"
                  value={form.foundingYear ?? ""}
                  onChange={(e) => setForm({ ...form, foundingYear: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mission</Label>
              <Textarea
                rows={3}
                value={form.mission ?? ""}
                onChange={(e) => setForm({ ...form, mission: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Vision</Label>
              <Textarea
                rows={3}
                value={form.vision ?? ""}
                onChange={(e) => setForm({ ...form, vision: e.target.value })}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Stats</Label>
                <Button variant="outline" size="sm" onClick={addStat}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add stat
                </Button>
              </div>
              <div className="space-y-2">
                {stats.length === 0 && (
                  <p className="text-sm text-muted-foreground">No stats yet.</p>
                )}
                {stats.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      placeholder="Label (Homes delivered)"
                      value={s.label}
                      onChange={(e) => setStat(i, { label: e.target.value })}
                    />
                    <Input
                      placeholder="Value (120)"
                      value={s.value}
                      onChange={(e) => setStat(i, { value: e.target.value })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeStat(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
