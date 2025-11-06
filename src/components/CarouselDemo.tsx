"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

export function CarouselDemo() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1);
    };

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", handleSelect);

    const pluginInstance = plugin.current;

    // Ensure autoplay resumes properly
    return () => {
      api.off("select", handleSelect);
      pluginInstance?.reset();
    };
  }, [api]);

  return (
    <div className="mx-auto max-w-[80vw] sm:max-w-[80vw] md:max-w-2xl lg:max-w-3xl">
      <Carousel
        setApi={setApi}
        className="w-full"
        plugins={[plugin.current]}
        opts={{ loop: true }}
        onMouseEnter={() => plugin.current.stop()}
        onMouseLeave={() => plugin.current.play()}
      >
        <CarouselContent className="relative">
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem
              key={index}
              className="transition-opacity duration-500 ease-in-out"
            >
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-4 sm:p-6 md:p-8">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-semibold">
                    {index + 1}
                  </span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-8 sm:-left-10 md:-left-12 lg:-left-14" />
        <CarouselNext className="hidden sm:flex -right-8 sm:-right-10 md:-right-12 lg:-right-14" />
      </Carousel>
      <div className="text-muted-foreground py-2 text-center text-xs sm:text-sm md:text-base">
        Pagina {current} de {count}
      </div>
    </div>
  );
}
