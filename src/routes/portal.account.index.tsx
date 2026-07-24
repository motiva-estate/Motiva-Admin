import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/portal/account/")({
  head: () => ({
    meta: [
      { title: "Account — Motiva Subscriber Portal" },
      { name: "description", content: "Confirm the contact details Motiva uses for reminders and updates." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PortalAccount,
});

function PortalAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const clientId = user?.clientId;

  const { data: client } = useQuery({
    queryKey: ["portal", "client", clientId],
    queryFn: () => api.clients.get(clientId!),
    enabled: !!clientId,
  });

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(true);
  useEffect(() => {
    if (client) {
      setEmail(client.email ?? "");
      setPhone(client.phone ?? "");
      setEmailNotif(client.notificationPrefs?.email ?? true);
      setWhatsappNotif(client.notificationPrefs?.whatsapp ?? true);
    }
  }, [client]);

  const save = useMutation({
    mutationFn: () =>
      api.clients.update(clientId!, {
        email,
        phone,
        contactConfirmedAt: new Date().toISOString(),
        notificationPrefs: { email: emailNotif, whatsapp: whatsappNotif },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal", "client", clientId] });
      toast.success("Contact details updated");
    },
  });

  const needsConfirm = client && !client.contactConfirmedAt;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These are the details Motiva uses for reminders and communications.
        </p>
      </div>

      {needsConfirm && (
        <Card className="border-[#D7C49E]/60 bg-[#D7C49E]/10">
          <CardContent className="flex items-start gap-3 py-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-[#8a6f2f]" />
            <div className="text-sm">
              <div className="font-medium text-foreground">Confirm your contact details</div>
              <div className="text-xs text-muted-foreground">
                Please review the email and phone below and press <span className="font-medium">Save changes</span> so we can send reminders to the right channels.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={client?.fullName ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone / WhatsApp</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 …" />
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
          {client?.contactConfirmedAt && (
            <p className="flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed on {new Date(client.contactConfirmedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminder preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Email reminders</div>
              <div className="text-xs text-muted-foreground">Installment due-date notices to your email.</div>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">WhatsApp reminders</div>
              <div className="text-xs text-muted-foreground">Short message to your registered WhatsApp number.</div>
            </div>
            <Switch checked={whatsappNotif} onCheckedChange={setWhatsappNotif} />
          </div>
          <p className="text-xs text-muted-foreground">
            Automated reminders arrive in Phase 2 — your preference is saved now so nothing changes when they switch on.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Password changes will be handled once accounts are live. For now, use the "Forgot password" link on the sign-in screen to reach the admin team.
          </p>
          <Button variant="outline" size="sm" disabled>Change password (coming soon)</Button>
        </CardContent>
      </Card>
    </div>
  );
}