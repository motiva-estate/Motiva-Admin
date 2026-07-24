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
import { api } from "@/lib/api/client";
import { FormSkeleton } from "@/components/admin/Skeletons";
import type { ContactInfo, Office, SocialLink } from "@/lib/api/types";

export const Route = createFileRoute("/admin/contact/")({
  component: ContactPage,
});

function ContactPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["contact"], queryFn: () => api.getContact() });
  const [form, setForm] = useState<Partial<ContactInfo>>({ offices: [], socialLinks: [] });
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: () => api.updateContact(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contact"] }); toast.success("Contact info saved"); },
  });

  const offices = form.offices ?? [];
  const social = form.socialLinks ?? [];

  const updateOffice = (i: number, patch: Partial<Office>) => {
    const next = [...offices];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, offices: next });
  };
  const addOffice = () => setForm({ ...form, offices: [...offices, { label: "", address: "", phone: "" }] });
  const removeOffice = (i: number) => setForm({ ...form, offices: offices.filter((_, x) => x !== i) });

  const updateSocial = (i: number, patch: Partial<SocialLink>) => {
    const next = [...social];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, socialLinks: next });
  };
  const addSocial = () => setForm({ ...form, socialLinks: [...social, { platform: "", url: "" }] });
  const removeSocial = (i: number) => setForm({ ...form, socialLinks: social.filter((_, x) => x !== i) });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Contact"
        description="Fields mirror the Sanity `contactInfo` singleton."
        actions={<Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>}
      />
      {isLoading ? <FormSkeleton rows={5} /> : (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Primary email</Label><Input value={form.primaryEmail ?? ""} onChange={(e) => setForm({ ...form, primaryEmail: e.target.value })} /></div>
            <div className="space-y-2"><Label>Secondary email</Label><Input value={form.secondaryEmail ?? ""} onChange={(e) => setForm({ ...form, secondaryEmail: e.target.value })} /></div>
            <div className="space-y-2"><Label>Primary phone</Label><Input value={form.primaryPhone ?? ""} onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })} /></div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input value={form.whatsappNumber ?? ""} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} /></div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Offices</Label>
              <Button variant="outline" size="sm" onClick={addOffice}><Plus className="mr-1 h-4 w-4" />Add office</Button>
            </div>
            <div className="space-y-3">
              {offices.map((o, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Label (e.g. HQ)" value={o.label} onChange={(e) => updateOffice(i, { label: e.target.value })} />
                    <Input placeholder="Phone" value={o.phone} onChange={(e) => updateOffice(i, { phone: e.target.value })} />
                    <Input className="col-span-2" placeholder="Address" value={o.address} onChange={(e) => updateOffice(i, { address: e.target.value })} />
                    <div className="col-span-2 flex justify-end">
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeOffice(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Social links</Label>
              <Button variant="outline" size="sm" onClick={addSocial}><Plus className="mr-1 h-4 w-4" />Add link</Button>
            </div>
            <div className="space-y-2">
              {social.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                  <Input placeholder="Platform (Instagram)" value={s.platform} onChange={(e) => updateSocial(i, { platform: e.target.value })} />
                  <Input placeholder="https://…" value={s.url} onChange={(e) => updateSocial(i, { url: e.target.value })} />
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeSocial(i)}>
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
