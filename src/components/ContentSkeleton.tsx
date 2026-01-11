import { cn } from "@/lib/utils";

interface ContentSkeletonProps {
  className?: string;
}

export function ContentSkeleton({ className }: ContentSkeletonProps) {
  return (
    <div className={cn("group relative block overflow-hidden rounded-xl bg-card border border-border", className)}>
      <div className="aspect-[2/3] relative overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-muted to-secondary animate-pulse" />
        
        {/* Skeleton badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          <div className="h-5 w-12 bg-muted animate-pulse rounded" />
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
        </div>
        
        {/* Skeleton favorite button */}
        <div className="absolute top-2 right-2">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}

interface CarouselSkeletonProps {
  count?: number;
}

export function CarouselSkeleton({ count = 6 }: CarouselSkeletonProps) {
  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory px-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="snap-start shrink-0 w-[45vw] sm:w-[30vw] md:w-[22vw] lg:w-[16vw]">
          <ContentSkeleton />
        </div>
      ))}
    </div>
  );
}
