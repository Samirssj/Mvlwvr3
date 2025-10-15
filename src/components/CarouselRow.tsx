import { ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselRowProps {
  title: string;
  children: ReactNode;
}

export function CarouselRow({ title, children }: CarouselRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) => {
    ref.current?.scrollBy({ left: delta, behavior: "smooth" });
  };
  return (
    <section className="relative">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-1 bg-primary rounded-full" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="relative">
        <div
          ref={ref}
          className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory px-1"
        >
          {children}
        </div>
        <div className="hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 border border-border"
            onClick={() => scrollBy(-600)}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 border border-border"
            onClick={() => scrollBy(600)}
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
