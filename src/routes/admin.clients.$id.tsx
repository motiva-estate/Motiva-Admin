import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api/client";
import type { Client, ClientSource, ClientStatus } from "@/lib/api/types";
import { SubStatusBadge } from "@/components/admin/StatusBadges";
import { SubscriptionFormDialog } from "@/components/admin/SubscriptionFormDialog";
import { RecordPaymentDialog } from "@/components/admin/RecordPaymentDialog";
import { Plus, Pencil, Wallet } from "lucide-react";
import type { Subscription } from "@/lib/api/types";

export const Route = createFileRoute("/admin/clients/$id")({
  component: ClientEditor,
});

function ClientEditor() {
  const { id } = useParams({ from: "/admin/clients/$id" });
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["client", id],
    queryFn: () => api.clients.get(id),
    enabled: !isNew,
  });
  const { data: subs } = useQuery({
    queryKey: ["subscriptions", id],
    queryFn: async () => (await api.subscriptions.list()).filter((s) => s.clientId === id),
    enabled: !isNew,
  });
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });
  const { data: clientPayments } = useQuery({
    queryKey: ["payments", "byClient", id],
    queryFn: () => api.payments.byClient(id),
    enabled: !isNew,
  });

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [paymentSub, setPaymentSub] = useState<Subscription | null>(null);

  const [form, setForm] = useState<Partial<Client>>({
    fullName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    contactAddress: "",
    source: "MANUAL",
    status: "LEAD",
    subscribedProjectIds: [],
    nextOfKin: { firstName: "", lastName: "", phone: "", address: "" },
    termsAccepted: false,
    signatureName: "",
    signatureDate: "",
    idDocumentUrl: "",
    utilityBillUrl: "",
    passportPhotoUrl: "",
    notes: "",
  });
  useEffect(() => {
    if (existing) {
      setForm({
        subscribedProjectIds: [],
        ...existing,
        nextOfKin: {
          firstName: existing.nextOfKin?.firstName ?? "",
          lastName: existing.nextOfKin?.lastName ?? "",
          phone: existing.nextOfKin?.phone ?? "",
          address: existing.nextOfKin?.address ?? "",
        },
      });
    }
  }, [existing]);

  const setNok = (patch: Partial<NonNullable<Client["nextOfKin"]>>) =>
    setForm((f) => ({ ...f, nextOfKin: { ...(f.nextOfKin ?? {}), ...patch } }));

  const toggleProject = (pid: string, checked: boolean) => {
    setForm((f) => {
      const cur = new Set(f.subscribedProjectIds ?? []);
      if (checked) cur.add(pid); else cur.delete(pid);
      return { ...f, subscribedProjectIds: Array.from(cur) };
    });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: Partial<Client> = {
        ...form,
        fullName:
          form.fullName?.trim() ||
          [form.firstName, form.lastName].filter(Boolean).join(" ").trim(),
      };
      return isNew ? api.clients.create(payload) : api.clients.update(id, payload);
    },
    onSuccess: (c) => {
      toast.success(isNew ? "Client created" : "Saved");
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", id] });
      if (isNew) navigate({ to: "/admin/clients/$id", params: { id: c.id } });
    },
  });

  const uploadField = (
    label: string,
    key: "idDocumentUrl" | "utilityBillUrl" | "passportPhotoUrl",
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          placeholder="https://…"
          value={form[key] ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById(`file-${key}`)?.click()}
        >
          Upload
        </Button>
        <input
          id={`file-${key}`}
          type="file"
          className="hidden"
          accept={key === "passportPhotoUrl" ? "image/*" : "image/*,.pdf"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            setForm((f) => ({ ...f, [key]: url }));
          }}
        />
      </div>
      {form[key] ? (
        <a href={form[key]} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
          Preview file
        </a>
      ) : null}
    </div>
  );

  return (
    <div className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <PageHeader
          title={isNew ? "New client" : form.fullName || "Client"}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate({ to: "/admin/clients" })}>Back</Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input value={form.firstName ?? ""} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input value={form.lastName ?? ""} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email address</Label>
                <Input type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone number</Label>
                <Input value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact address</Label>
              <Textarea rows={2} value={form.contactAddress ?? ""} onChange={(e) => setForm((f) => ({ ...f, contactAddress: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm((f) => ({ ...f, source: v as ClientSource }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEBSITE_FORM">Website form</SelectItem>
                    <SelectItem value="BULK_IMPORT">Bulk import</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="REFERRAL">Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ClientStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEAD">Lead</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="LAPSED">Lapsed</SelectItem>
                    <SelectItem value="CONVERTED">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Projects subscribing to</CardTitle></CardHeader>
          <CardContent>
            {!projects || projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {projects.map((p) => {
                  const checked = (form.subscribedProjectIds ?? []).includes(p.id);
                  return (
                    <label key={p.id} className="flex items-start gap-2 rounded-md border border-border p-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => toggleProject(p.id, !!v)}
                      />
                      <div>
                        <div className="text-sm font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">{p.location}, {p.city}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Next of kin / emergency contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input value={form.nextOfKin?.firstName ?? ""} onChange={(e) => setNok({ firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input value={form.nextOfKin?.lastName ?? ""} onChange={(e) => setNok({ lastName: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Phone contact</Label>
                <Input value={form.nextOfKin?.phone ?? ""} onChange={(e) => setNok({ phone: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Contact address</Label>
                <Textarea rows={2} value={form.nextOfKin?.address ?? ""} onChange={(e) => setNok({ address: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {uploadField("Valid means of identification", "idDocumentUrl")}
            {uploadField("Utility bill", "utilityBillUrl")}
            {uploadField("Passport photograph", "passportPhotoUrl")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Agreement</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-2">
              <Checkbox
                checked={!!form.termsAccepted}
                onCheckedChange={(v) => setForm((f) => ({ ...f, termsAccepted: !!v }))}
              />
              <span className="text-sm">Client has accepted the terms and conditions.</span>
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Signature (typed name)</Label>
                <Input value={form.signatureName ?? ""} onChange={(e) => setForm((f) => ({ ...f, signatureName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.signatureDate ?? ""} onChange={(e) => setForm((f) => ({ ...f, signatureDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Internal notes</Label>
              <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isNew && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Subscriptions</CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setEditingSub(null); setSubDialogOpen(true); }}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {!subs || subs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subscriptions.</p>
              ) : (
                subs.map((s) => {
                  const total = s.totalPrice ?? s.amount ?? 0;
                  const paid = s.amountPaid ?? 0;
                  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                  return (
                    <div key={s.id} className="rounded-md border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{s.plan}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {s.projectRef ? `${s.projectRefType ?? "project"} · ${s.projectRef}` : "No project link"}
                          </div>
                        </div>
                        <SubStatusBadge status={s.status} />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {format(new Date(s.startDate), "MMM d, yyyy")} → {format(new Date(s.endDate), "MMM d, yyyy")}
                      </div>
                      <div className="mt-2 space-y-1">
                        <Progress value={pct} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{s.currency} {paid.toLocaleString()} paid</span>
                          <span>of {total.toLocaleString()}</span>
                        </div>
                      </div>
                      {s.nextDueDate && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Next due {format(new Date(s.nextDueDate), "MMM d, yyyy")}
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingSub(s); setSubDialogOpen(true); }}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPaymentSub(s)}>
                          <Wallet className="mr-1 h-3.5 w-3.5" /> Record payment
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Portal & notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email reminders</Label>
                  <p className="text-xs text-muted-foreground">Payment reminders and status updates.</p>
                </div>
                <Switch
                  checked={form.notificationPrefs?.email ?? true}
                  onCheckedChange={(v) => setForm((f) => ({
                    ...f,
                    notificationPrefs: { email: v, whatsapp: f.notificationPrefs?.whatsapp ?? false },
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>WhatsApp reminders</Label>
                  <p className="text-xs text-muted-foreground">Sent alongside email reminders.</p>
                </div>
                <Switch
                  checked={form.notificationPrefs?.whatsapp ?? false}
                  onCheckedChange={(v) => setForm((f) => ({
                    ...f,
                    notificationPrefs: { email: f.notificationPrefs?.email ?? true, whatsapp: v },
                  }))}
                />
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="text-sm font-medium">First-login contact confirmation</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {form.contactConfirmedAt
                    ? `Confirmed ${format(new Date(form.contactConfirmedAt), "PP")}`
                    : "Not yet confirmed — client will be prompted on first portal login."}
                </p>
                {form.contactConfirmedAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setForm((f) => ({ ...f, contactConfirmedAt: undefined }))}
                  >
                    Reset prompt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {clientPayments && clientPayments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Recent payments</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {clientPayments.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(p.date), "PP")}</div>
                    </div>
                    <div className="text-sm">{p.currency} {p.amount.toLocaleString()}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <SubscriptionFormDialog
            open={subDialogOpen}
            onOpenChange={setSubDialogOpen}
            existing={editingSub}
            fixedClientId={id}
          />
          <RecordPaymentDialog
            open={!!paymentSub}
            onOpenChange={(v: boolean) => !v && setPaymentSub(null)}
            subscription={paymentSub}
          />
        </div>
      )}
    </div>
  );
}
