import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { FileText, Lock, ExternalLink } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePortalAuth } from "@/lib/auth/context";
import { api } from "@/lib/api/client";
import { pageProps, stagger, staggerItem, slideUp } from "@/lib/motion";
import { PortalDocumentsSkeleton } from "@/components/portal/PortalSkeletons";

export const Route = createFileRoute("/portal/documents/")({
  head: () => ({
    meta: [
      { title: "Documents — Motiva Subscriber Portal" },
      {
        name: "description",
        content: "Receipts, allocation letters and title documents for your Motiva subscriptions.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PortalDocuments,
});

function PortalDocuments() {
  const { user } = usePortalAuth();
  const clientId = user?.clientId;

  const { data: subs } = useQuery({
    queryKey: ["portal", "subscriptions", clientId],
    queryFn: () => api.portal.listSubscriptions(),
    enabled: !!clientId,
  });
  const { data: docs, isLoading } = useQuery({
    queryKey: ["portal", "documents", clientId],
    queryFn: () => api.documents.listPortal(),
    enabled: !!clientId,
  });

  const groups = (subs ?? []).map((s) => ({
    sub: s,
    docs: (docs ?? []).filter((d) => d.subscriptionId === (s._id ?? s.id)),
  }));

  if (isLoading) return <PortalDocumentsSkeleton />;

  return (
    <motion.div className="space-y-8" {...pageProps}>
      <motion.div variants={slideUp}>
        <h1 className="font-display text-3xl text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grouped by subscription. Receipts are visible immediately; title deeds and allocation
          letters unlock automatically once the linked payment milestone is met.
        </p>
      </motion.div>

      {!isLoading && (!docs || docs.length === 0) && (
        <motion.div variants={slideUp}>
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No documents have been uploaded to your subscriptions yet.
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div className="space-y-8" variants={stagger}>
        {groups.map(({ sub, docs: items }) => (
          <motion.section key={sub._id ?? sub.id} variants={staggerItem}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-foreground">{sub.plan}</h2>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {sub.projectRefType === "land" ? "Land parcel" : "Residence"} · {items.length}{" "}
                  document{items.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/portal/subscriptions/$id" params={{ id: sub._id ?? sub.id ?? "" }}>
                  Open subscription
                </Link>
              </Button>
            </div>
            {items.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-xs text-muted-foreground">
                  No documents yet on this subscription.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((d) => {
                  const visible = (d as any).visible ?? false;
                  const url = (d as any).url ?? null;
                  return (
                    <Card key={d.id} className="transition-shadow duration-200 hover:shadow-sm">
                      <CardContent className="flex items-start justify-between gap-4 py-4">
                        <div className="flex items-start gap-3">
                          {visible ? (
                            <FileText className="mt-0.5 h-5 w-5 text-primary" />
                          ) : (
                            <Lock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-foreground">{d.label}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              Uploaded {format(new Date(d.uploadedAt), "PP")}
                            </div>
                            {!visible && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                {d.visibility === "on_full_payment"
                                  ? "Unlocks once this subscription is fully paid."
                                  : `Unlocks on milestone: ${d.visibility.replace("on_milestone:", "")}`}
                              </div>
                            )}
                          </div>
                        </div>
                        {visible && !!url ? (
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
            )}
          </motion.section>
        ))}
      </motion.div>
    </motion.div>
  );
}
