import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Lock,
  MessageSquare,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api/client";
import { currency, isDocumentVisible, resolveDocumentUrl } from "@/lib/portal/visibility";
import { buildSchedule } from "@/lib/portal/schedule";
import { resolveProjectRef } from "@/lib/portal/project-ref";

export const Route = createFileRoute("/portal/subscriptions/$id")({
  head: () => ({
    meta: [
      { title: "Subscription — Motiva Subscriber Portal" },
      {
        name: "description",
        content:
          "Full detail for this Motiva subscription — schedule, payments, documents and updates.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SubscriptionDetail,
});

function SubscriptionDetail() {
  const { id } = useParams({ from: "/portal/subscriptions/$id" });
  const { user } = useAuth();

  const { data: subs } = useQuery({
    queryKey: ["portal", "subscriptions", user?.clientId],
    queryFn: () => api.portal.listSubscriptions(),
    enabled: !!user?.clientId,
  });
  const sub = subs?.find((s) => s.id === id);

  const { data: info } = useQuery({
    queryKey: ["portal", "projectRef", sub?.projectRef, sub?.projectRefType],
    queryFn: () => resolveProjectRef(sub?.projectRef, sub?.projectRefType),
    enabled: !!sub?.projectRef,
  });
  const { data: docs } = useQuery({
    queryKey: ["portal", "documents", "sub", id],
    queryFn: () => api.documents.listForSubscription(id),
  });
  const { data: updates } = useQuery({
    queryKey: ["portal", "updatesForProject", sub?.projectRef],
    queryFn: () => api.projectUpdates.listForProject(sub!.projectRef!),
    enabled: !!sub?.projectRef,
  });
  const { data: payments } = useQuery({
    queryKey: ["portal", "payments", "sub", id],
    queryFn: () => api.payments.bySubscription(id),
  });

  if (!sub) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Subscription not found.{" "}
          <Link to="/portal" className="ml-1 underline">
            Back to overview
          </Link>
        </CardContent>
      </Card>
    );
  }

  const total = sub.totalPrice ?? sub.amount ?? 0;
  const paid = sub.amountPaid ?? 0;
  const balance = Math.max(total - paid, 0);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const fullyPaid = total > 0 && paid >= total;
  const schedule = buildSchedule(sub);

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/portal"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to overview
        </Link>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="relative h-56 w-full bg-muted sm:h-64">
          {info?.coverImageUrl && (
            <img src={info.coverImageUrl} alt={info.name} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
            <div>
              <div className="text-[11px] uppercase tracking-wide opacity-85">
                {sub.projectRefType === "land" ? "Land parcel" : "Residence"} ·{" "}
                {sub.paymentPlan ?? "Custom plan"}
              </div>
              <h1 className="mt-1 font-display text-3xl leading-tight">{info?.name ?? sub.plan}</h1>
              {info?.location && <div className="mt-0.5 text-sm opacity-90">{info.location}</div>}
            </div>
            <Badge className="bg-white/90 text-foreground hover:bg-white">
              {fullyPaid ? "Fully paid" : (info?.phaseLabel ?? sub.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Payment overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 py-5">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-lg font-medium">{currency(total, sub.currency)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Paid</div>
                <div className="text-lg font-medium">{currency(paid, sub.currency)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Balance</div>
                <div className="text-lg font-medium">{currency(balance, sub.currency)}</div>
              </div>
            </div>
            <Progress value={pct} />
            <div className="text-xs text-muted-foreground">{pct}% of total settled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 py-5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Next installment
            </div>
            {sub.nextDueDate && !fullyPaid ? (
              <>
                <div className="text-sm font-medium text-foreground">
                  {format(new Date(sub.nextDueDate), "PPPP")}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled
                  className="w-full"
                  title="Live payments come in Phase 2"
                >
                  Generate payment reference
                </Button>
                <Button asChild size="sm" variant="ghost" className="w-full">
                  <a href="mailto:hello@motivaestate.com?subject=Off-schedule%20payment%20request">
                    <MessageSquare className="mr-1 h-4 w-4" /> Request off-schedule
                  </a>
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nothing scheduled — you're fully paid.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <section>
        <h2 className="mb-3 font-display text-xl">Payment schedule</h2>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {schedule.map((r) => (
                <li
                  key={r.index}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="flex items-center gap-3">
                    {r.status === "paid" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : r.status === "next" ? (
                      <CalendarClock className="h-4 w-4 text-[#8a6f2f]" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>
                      <span className="font-medium text-foreground">Installment {r.index}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {format(new Date(r.dueDate), "PPP")}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm">{currency(r.amount, sub.currency)}</span>
                    <Badge
                      variant={
                        r.status === "paid"
                          ? "secondary"
                          : r.status === "next"
                            ? "default"
                            : "outline"
                      }
                    >
                      {r.status}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Payment history */}
      <section>
        <h2 className="mb-3 font-display text-xl">Payment history</h2>
        {payments && payments.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium text-foreground">{p.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(p.date), "PPP")}
                      </div>
                    </div>
                    <div className="text-sm font-medium">{currency(p.amount, p.currency)}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No payments recorded yet.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Documents */}
      <section>
        <h2 className="mb-3 font-display text-xl">Documents</h2>
        {docs && docs.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {docs.map((d) => {
              const visible = isDocumentVisible(d, sub);
              const url = resolveDocumentUrl(d, sub);
              return (
                <Card key={d.id}>
                  <CardContent className="flex items-start justify-between gap-3 py-4">
                    <div className="flex items-start gap-3">
                      {visible ? (
                        <FileText className="mt-0.5 h-5 w-5 text-primary" />
                      ) : (
                        <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-foreground">{d.label}</div>
                        <div className="text-xs text-muted-foreground">
                          Uploaded {format(new Date(d.uploadedAt), "PP")}
                        </div>
                        {!visible && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {d.visibility === "on_full_payment"
                              ? "Unlocks once fully paid."
                              : `Unlocks on: ${d.visibility.replace("on_milestone:", "")}`}
                          </div>
                        )}
                      </div>
                    </div>
                    {visible && url ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={url} target="_blank" rel="noreferrer">
                          View <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="outline">Locked</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No documents attached yet.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Updates */}
      <section>
        <h2 className="mb-3 font-display text-xl">Project updates</h2>
        {updates && updates.length > 0 ? (
          <div className="space-y-3">
            {updates.map((u) => (
              <Card key={u.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(u.postedAt), "PPP")}
                  </div>
                  <p className="text-sm text-foreground">{u.text}</p>
                  {u.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {u.photos.map((p, i) => (
                        <img
                          key={i}
                          src={p}
                          alt=""
                          className="h-32 w-full rounded-md object-cover"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No updates yet.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
