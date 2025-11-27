"use client";
import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/lib/utils";

type CarouselItemData = {
  src: string;
  alt?: string;
  caption?: string;
  href?: string;
  ctaLabel?: string;
};

interface PrettyCarouselProps {
  items?: CarouselItemData[];
  /** "video" = 16:9, "square" = 1:1 */
  aspect?: "video" | "square";
  showThumbnails?: boolean;
  autoPlayDelay?: number; // ms
  className?: string;
}

export function PrettyCarousel({
  items,
  aspect = "video",
  autoPlayDelay = 3000,
  className,
}: PrettyCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [loaded, setLoaded] = React.useState<Record<number, boolean>>({});

  const plugin = React.useRef(
    Autoplay({
      delay: autoPlayDelay,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

  React.useEffect(() => {
    if (!api) return;

    const handleSelect = () => setCurrent(api.selectedScrollSnap());
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", handleSelect);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") api.scrollNext();
      if (e.key === "ArrowLeft") api.scrollPrev();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      api.off("select", handleSelect);
      window.removeEventListener("keydown", onKey);
      // eslint-disable-next-line
      plugin.current?.reset();
    };
  }, [api]);

  const data: CarouselItemData[] =
    items && items.length
      ? items
      : Array.from({ length: 5 }).map((_, i) => ({
          src: `https://picsum.photos/seed/shadcn-${i}/1600/900`,
          alt: `Placeholder ${i + 1}`,
        }));

  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-video";

  return (
    <div className={cn("mx-auto w-full max-w-6xl", className)}>
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="relative">
            <Carousel
              setApi={setApi}
              className="w-full"
              plugins={[plugin.current]}
              opts={{ loop: true, align: "start" }}
              onMouseEnter={() => plugin.current.stop()}
              onMouseLeave={() => plugin.current.play()}
            >
              <CarouselContent>
                {data.map((item, index) => (
                  <CarouselItem key={index} className="pl-2 md:pl-4">
                    <figure
                      className={cn(
                        "relative overflow-hidden rounded-2xl ring-1 ring-border shadow-lg",
                        "bg-muted/30 backdrop-blur",
                        aspectClass
                      )}
                    >
                      {!loaded[index] && (
                        <div className="absolute inset-0 animate-pulse bg-muted" />
                      )}
                      {/* Image */}
                      <img
                        src={item.src}
                        alt={item.alt ?? ""}
                        className={cn(
                          "h-full w-full object-cover transition-transform duration-500",
                          "hover:scale-[1.02]"
                        )}
                        onLoad={() =>
                          setLoaded((s) => ({ ...s, [index]: true }))
                        }
                      />

                      {/* Bottom gradient + caption */}
                      {(item.caption || item.ctaLabel) && (
                        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0">
                          <div className="flex items-end p-4 md:p-6">
                            <div className="pointer-events-auto w-full overflow-hidden">
                              <div className="rounded-xl bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  {item.ctaLabel && (
                                    <a
                                      href={item.href ?? "#"}
                                      className="shrink-0"
                                    >
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl shadow bg-white"
                                      >
                                        {item.ctaLabel}
                                      </Button>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </figcaption>
                      )}
                    </figure>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Arrow controls */}
              <CarouselPrevious className=" sm:flex -left-3 md:-left-6 h-10 w-10 rounded-full bg-white hover:bg-gray-100 shadow-md" />
              <CarouselNext className="hidden sm:flex -right-3 md:-right-6 h-10 w-10 rounded-full bg-white hover:bg-gray-100 shadow-md" />
            </Carousel>

            {/* Dots */}
            <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  aria-label={`Ir al slide ${i + 1}`}
                  onClick={() => api?.scrollTo(i)}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-al",
                    i === current
                      ? "w-6 bg-white"
                      : "bg-white/40 hover:bg-primary/60"
                  )}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pager text */}
      <div className="py-2 text-center text-sm text-muted-foreground">
        Página {count ? current + 1 : 0} de {count}
      </div>
    </div>
  );
}

// Backwards-compatible export name if you were importing `CarouselDemo`
export const CarouselDemo = PrettyCarousel;
