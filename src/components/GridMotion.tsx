import { useEffect, useRef, useState } from "react";
import type { FC, ReactNode } from "react";
import { gsap } from "gsap";

interface GridMotionProps {
  items?: (string | ReactNode)[];
  gradientColor?: string;
}

const GridMotion: FC<GridMotionProps> = ({
  items = [],
  gradientColor = "black",
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseXRef = useRef<number>(window.innerWidth / 2);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const totalItems = isMobile ? 12 : 28;
  const defaultItems = Array.from(
    { length: totalItems },
    (_, index) => `Item ${index + 1}`
  );
  const combinedItems =
    items.length > 0
      ? Array.from({ length: totalItems }, (_, i) => items[i % items.length])
      : defaultItems;

  useEffect(() => {
    gsap.ticker.lagSmoothing(0);

    const handleMouseMove = (e: MouseEvent): void => {
      mouseXRef.current = e.clientX;
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (e.touches.length > 0) {
        mouseXRef.current = e.touches[0].clientX;
      }
    };

    const updateMotion = (): void => {
      const maxMoveAmount = isMobile ? 100 : 300;
      const baseDuration = isMobile ? 1.2 : 0.8;
      const inertiaFactors = isMobile ? [0.8, 0.6, 0.4] : [0.6, 0.4, 0.3, 0.2];

      rowRefs.current.forEach((row, index) => {
        if (row) {
          const direction = index % 2 === 0 ? 1 : -1;
          const moveAmount =
            ((mouseXRef.current / window.innerWidth) * maxMoveAmount -
              maxMoveAmount / 2) *
            direction;

          gsap.to(row, {
            x: moveAmount,
            duration:
              baseDuration + inertiaFactors[index % inertiaFactors.length],
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      });
    };

    const removeAnimationLoop = gsap.ticker.add(updateMotion);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      removeAnimationLoop();
    };
  }, [isMobile]);

  return (
    <div ref={gridRef} className="h-full w-full overflow-hidden">
      <section
        className="w-full h-screen overflow-hidden relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-[4] bg-[length:250px]"></div>
        <div
          className={`gap-2 md:gap-4 flex-none relative ${
            isMobile ? "w-[200vw] h-[120vh]" : "w-[150vw] h-[150vh]"
          } grid ${
            isMobile ? "grid-rows-3" : "grid-rows-4"
          } grid-cols-1 rotate-[-15deg] origin-center z-[2]`}
        >
          {Array.from({ length: isMobile ? 3 : 4 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className={`grid gap-2 md:gap-4 ${
                isMobile ? "grid-cols-4" : "grid-cols-7"
              }`}
              style={{ willChange: "transform, filter" }}
              ref={(el) => {
                if (el) rowRefs.current[rowIndex] = el;
              }}
            >
              {Array.from({ length: isMobile ? 4 : 7 }, (_, itemIndex) => {
                const content =
                  combinedItems[rowIndex * (isMobile ? 4 : 7) + itemIndex];
                return (
                  <div key={itemIndex} className="relative">
                    <div className="relative w-full h-full overflow-hidden rounded-[8px] md:rounded-[10px] bg-[#111] flex items-center justify-center text-white text-base md:text-[1.5rem]">
                      {typeof content === "string" &&
                      (content.startsWith("http") ||
                        content.startsWith("/") ||
                        content.startsWith(".")) ? (
                        <div
                          className="w-full h-full bg-cover bg-center absolute top-0 left-0"
                          style={{ backgroundImage: `url(${content})` }}
                        ></div>
                      ) : (
                        <div className="p-2 md:p-4 text-center z-[1]">
                          {content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="relative w-full h-full top-0 left-0 pointer-events-none"></div>
      </section>
    </div>
  );
};

export default GridMotion;
