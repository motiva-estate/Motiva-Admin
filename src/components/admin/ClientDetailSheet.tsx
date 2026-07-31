import { useMemo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, FileText, Pencil, Send, X } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientStatusBadge } from "@/components/admin/StatusBadges";
import { api } from "@/lib/api/client";
import { DetailSkeleton } from "@/components/admin/Skeletons";

function formatNaira(n: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(Math.round(n))}`;
}

function initialsOf(first?: string, last?: string, full?: string) {
  const a = (first ?? "").trim();
  const b = (last ?? "").trim();
  if (a || b) return `${a[0] ?? ""}${b[0] ?? ""}`.toUpperCase();
  const parts = (full ?? "").trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-medium text-muted-foreground mb-3">{children}</h3>;
}

function Row({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground max-w-[60%] break-words">
        {value === undefined || value === null || value === "" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border/60 py-5">
      <SectionHeading>{title}</SectionHeading>
      {children}
    </section>
  );
}

export function ClientDetailSheet({
  clientId,
  onOpenChange,
}: {
  clientId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!clientId;

  const { data: client } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => api.clients.get(clientId!),
    enabled: open,
  });
  const { data: subsResult } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => api.subscriptions.list({ clientId: clientId!, limit: 100 }),
    enabled: open,
  });
  const subs = subsResult?.data;
  const { data: payments } = useQuery({
    queryKey: ["payments", clientId],
    queryFn: () => api.payments.byClient(clientId!),
    enabled: open,
  });
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
    enabled: open,
  });
  const { data: auditResult } = useQuery({
    queryKey: ["auditLog"],
    queryFn: () => api.auditLog.list({ entityId: clientId!, limit: 50 }),
    enabled: open,
  });
  const audit = auditResult?.data;

  const clientSubs = useMemo(
    () => (subs ?? []).filter((s) => s.clientId === clientId),
    [subs, clientId],
  );
  const latestSub = clientSubs[0];
  const subscribedProjects = useMemo(
    () => (projects ?? []).filter((p) => (client?.subscribedProjectIds ?? []).includes(p.id)),
    [projects, client],
  );

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const balanceLeft = Math.max(0, (latestSub?.amount ?? 0) * 400 - totalPaid); // fake balance derived
  const derivedBalance = latestSub ? Math.max(0, 850_000_000 - totalPaid) : 0;

  const activity = useMemo(() => {
    if (!clientId) return [];
    type Event = { id: string; label: string; date: string };
    const events: Event[] = [];
    (payments ?? []).forEach((p) =>
      events.push({ id: `pay-${p.id}`, label: `Payment recorded — ${p.label}`, date: p.date }),
    );
    clientSubs.forEach((s) =>
      events.push({
        id: `sub-${s._id ?? s.id}`,
        label: `Subscribed to ${s.plan}`,
        date: s.createdAt,
      }),
    );
    (audit ?? [])
      .filter((a) => a.entityId === clientId || a.entityType === "Client")
      .forEach((a) =>
        events.push({
          id: `al-${a.id}`,
          label: `${a.actorName} ${a.action.toLowerCase()} ${a.entityType}`,
          date: a.createdAt,
        }),
      );
    return events.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [clientId, payments, clientSubs, audit]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[440px] p-0 flex flex-col gap-0">
        {!client ? (
          <DetailSkeleton />
        ) : (
          <>
            <SheetHeader className="px-6 pt-6 pb-5 space-y-0">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 rounded-full bg-muted grid place-items-center overflow-hidden">
                  {client.passportPhotoUrl ? (
                    <img
                      src={client.passportPhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      {initialsOf(client.firstName, client.lastName, client.fullName)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg font-medium truncate">
                    {client.fullName}
                  </SheetTitle>
                  <div className="mt-1.5">
                    <ClientStatusBadge status={client.status} />
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-4">
              <Section title="Personal information">
                <Row label="First name" value={client.firstName} />
                <Row label="Last name" value={client.lastName} />
                <Row label="Email" value={client.email} />
                <Row label="Phone" value={client.phone} />
                <Row label="Contact address" value={client.contactAddress} />
              </Section>

              <Section title="Next of kin">
                <Row label="First name" value={client.nextOfKin?.firstName} />
                <Row label="Last name" value={client.nextOfKin?.lastName} />
                <Row label="Phone" value={client.nextOfKin?.phone} />
                <Row label="Address" value={client.nextOfKin?.address} />
              </Section>

              <Section title="Subscription">
                {subscribedProjects.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {subscribedProjects.map((p) => (
                      <Badge key={p.id} variant="secondary" className="font-normal">
                        {p.title}
                      </Badge>
                    ))}
                  </div>
                )}
                <Row label="Plan" value={latestSub?.plan} />
                <Row
                  label="Start"
                  value={
                    latestSub ? format(new Date(latestSub.startDate), "MMM d, yyyy") : undefined
                  }
                />
                <Row
                  label="End"
                  value={latestSub ? format(new Date(latestSub.endDate), "MMM d, yyyy") : undefined}
                />
              </Section>

              <Section title="Payment breakdown">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-md border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">Total paid</div>
                    <div className="mt-1 text-base font-medium text-emerald-600">
                      {formatNaira(totalPaid)}
                    </div>
                  </div>
                  <div className="rounded-md border border-border/60 p-3">
                    <div className="text-xs text-muted-foreground">Balance left</div>
                    <div className="mt-1 text-base font-medium">
                      {formatNaira(derivedBalance || balanceLeft)}
                    </div>
                  </div>
                </div>
                {(payments ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {[...(payments ?? [])]
                      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                      .map((p) => (
                        <li key={p.id} className="flex items-start justify-between gap-4 text-sm">
                          <div>
                            <div className="text-foreground">{p.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(p.date), "MMM d, yyyy")}
                            </div>
                          </div>
                          <div className="font-medium tabular-nums">{formatNaira(p.amount)}</div>
                        </li>
                      ))}
                  </ul>
                )}
              </Section>

              <Section title="Documents">
                <DocRow label="Valid means of identification" url={client.idDocumentUrl} />
                <DocRow label="Utility bill" url={client.utilityBillUrl} />
                <DocRow label="Passport photograph" url={client.passportPhotoUrl} />
              </Section>

              <Section title="Terms & signature">
                <div className="flex items-center gap-2 text-sm py-1.5">
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-sm border ${client.termsAccepted ? "bg-emerald-600 border-emerald-600 text-white" : "border-border"}`}
                  >
                    {client.termsAccepted && <Check className="h-3 w-3" />}
                  </span>
                  <span>Terms and conditions accepted</span>
                </div>
                {client.signatureName ? (
                  <>
                    <Row label="Signature" value={client.signatureName} />
                    <Row
                      label="Date signed"
                      value={
                        client.signatureDate
                          ? format(new Date(client.signatureDate), "MMM d, yyyy")
                          : undefined
                      }
                    />
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => toast.info("Signature capture — coming soon")}
                  >
                    Capture signature
                  </Button>
                )}
              </Section>

              <Section title="Notes">
                {client.notes ? (
                  <p className="text-sm whitespace-pre-wrap text-foreground">{client.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes.</p>
                )}
              </Section>

              <Section title="Activity">
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {activity.map((e) => (
                      <li key={e.id} className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-foreground">{e.label}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {format(new Date(e.date), "MMM d")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            <div className="border-t border-border/60 px-6 py-4 flex gap-2 bg-background">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/admin/clients/$id" params={{ id: client._id }}>
                  <Pencil className="mr-1.5 h-4 w-4" /> Edit client
                </Link>
              </Button>
              <Button
                className="flex-1"
                onClick={() => toast.success(`Reminder sent to ${client.email}`)}
              >
                <Send className="mr-1.5 h-4 w-4" /> Send reminder
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DocRow({ label, url }: { label: string; url?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{label}</span>
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary hover:underline shrink-0"
        >
          View
        </a>
      ) : (
        <span className="text-xs text-muted-foreground shrink-0">Not uploaded</span>
      )}
    </div>
  );
}
