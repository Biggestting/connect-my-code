import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}
