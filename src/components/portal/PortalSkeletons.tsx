/**
 * Loading skeletons for all subscriber portal pages.
 * Each skeleton mirrors the layout of the real page so the viewport
 * doesn't jump when content arrives.
 */
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ── Shared helpers ────────────────────────────────────────────────────────────
function SkeletonHeading() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}

function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-4 ${i === 0 ? "w-3/4" : i % 2 === 0 ? "w-1/2" : "w-2/3"}`}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ── Portal overview (portal.index) ────────────────────────────────────────────
export function PortalOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <SkeletonHeading />
      {/* Next due banner */}
      <Skeleton className="h-20 w-full rounded-xl" />
      {/* Subscription cards */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-4 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Subscription detail (portal.subscriptions.$id) ───────────────────────────
export function PortalSubDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-4 w-28" />
      {/* Hero image */}
      <Skeleton className="h-56 w-full rounded-xl sm:h-64" />
      {/* Payment overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 py-5">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3.5 w-12" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 py-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
      {/* Schedule */}
      <SkeletonCard rows={5} />
    </div>
  );
}

// ── Documents (portal.documents) ─────────────────────────────────────────────
export function PortalDocumentsSkeleton() {
  return (
    <div className="space-y-8">
      <SkeletonHeading />
      {[1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-28" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3].map((j) => (
              <Card key={j}>
                <CardContent className="flex items-start justify-between gap-4 py-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Project updates (portal.updates) ─────────────────────────────────────────
export function PortalUpdatesSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonHeading />
      {/* Filter pills */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      {/* Update cards */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="flex gap-0 p-0">
            <Skeleton className="hidden h-40 w-40 sm:block" />
            <div className="flex-1 space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Account (portal.account) ─────────────────────────────────────────────────
export function PortalAccountSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      <SkeletonHeading />
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: i === 1 ? 3 : 2 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
