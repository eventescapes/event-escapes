import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden" data-testid="skeleton-event-card">
      <Skeleton className="w-full h-48" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

export function HotelCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border" data-testid="skeleton-hotel-card">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Skeleton className="w-full h-48 rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-18" />
            </div>
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="space-y-3">
            <Skeleton className="h-8 w-20 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border" data-testid="skeleton-flight-card">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center space-y-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
            <div className="flex-1 text-center space-y-1">
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
        <div className="md:col-span-1">
          <Skeleton className="h-4 w-20 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="space-y-3">
            <Skeleton className="h-8 w-20 ml-auto" />
            <Skeleton className="h-3 w-16 ml-auto" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
