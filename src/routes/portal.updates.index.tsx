import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/context";
import { api } from "@/lib/api/client";
import { resolveProjectRef } from "@/lib/portal/project-ref";

export const Route = createFileRoute("/portal/updates/")({
  head: () => ({
    meta: [
      { title: "Project updates — Motiva Subscriber Portal" },
      {
        name: "description",
        content: "Timeline of progress updates for the projects and parcels you're subscribed to.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PortalUpdates,
});

function PortalUpdates() {
  const { user } = useAuth();
  const clientId = user?.clientId;
  const { data: updates, isLoading } = useQuery({
    queryKey: ["portal", "updates", clientId],
    queryFn: () => api.projectUpdates.listForClient(clientId!),
    enabled: !!clientId,
  });
  const { data: subs } = useQuery({
    queryKey: ["portal", "subscriptions", clientId],
    queryFn: () => api.portal.listSubscriptions(),
    enabled: !!clientId,
  });
  const [filter, setFilter] = useState<string | null>(null);

  const refs = Array.from(
    new Map((subs ?? []).filter((s) => s.projectRef).map((s) => [s.projectRef!, s])).entries(),
  );
  const shown = (updates ?? []).filter((u) => !filter || u.projectRef === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Project updates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Progress notes posted by the Motiva team for projects and parcels linked to your
          subscriptions.
        </p>
      </div>

      {refs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`rounded-full border px-3 py-1 text-xs transition ${filter === null ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFilter(null)}
          >
            All projects
          </button>
          {refs.map(([ref, sub]) => (
            <button
              key={ref}
              className={`rounded-full border px-3 py-1 text-xs transition ${filter === ref ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
              onClick={() => setFilter(ref)}
            >
              {sub.plan}
            </button>
          ))}
        </div>
      )}

      {isLoading && <div className="text-sm text-muted-foreground">Loading updates…</div>}

      {!isLoading && shown.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No project updates {filter ? "for this project yet." : "yet."}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {shown.map((u) => (
          <UpdateCard key={u.id} update={u} />
        ))}
      </div>
    </div>
  );
}

function UpdateCard({
  update: u,
}: {
  update: NonNullable<
    ReturnType<typeof api.projectUpdates.listForClient> extends Promise<infer T> ? T : never
  >[number];
}) {
  const { data: info } = useQuery({
    queryKey: ["portal", "projectRef", u.projectRef, u.projectRefType],
    queryFn: () => resolveProjectRef(u.projectRef, u.projectRefType),
  });
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex gap-0 p-0">
        {info?.coverImageUrl && (
          <div className="hidden w-40 shrink-0 sm:block">
            <img src={info.coverImageUrl} alt={info.name} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex-1 space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {u.projectRefType === "land" ? "Land parcel" : "Project"}
              </div>
              <div className="font-display text-lg text-foreground">
                {info?.name ?? u.projectRef}
              </div>
            </div>
            <Badge variant="outline">{format(new Date(u.postedAt), "PP")}</Badge>
          </div>
          <p className="text-sm text-foreground">{u.text}</p>
          {u.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {u.photos.map((p, i) => (
                <img key={i} src={p} alt="" className="h-32 w-full rounded-md object-cover" />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
