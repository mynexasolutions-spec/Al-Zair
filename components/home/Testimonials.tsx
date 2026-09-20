'use client';

import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TestimonialItem, defaultHomepageContent } from '@/data/homepageContent';

interface TestimonialsProps {
  items?: TestimonialItem[];
}

export function Testimonials({ items }: TestimonialsProps) {
  const testimonials = useMemo(() => {
    const rawList = items && items.length > 0 ? items : defaultHomepageContent.testimonials;
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();
    const unique: TestimonialItem[] = [];

    for (const t of rawList) {
      const normalizedName = (t.name || '').trim().toLowerCase();
      const id = t.id || '';
      if (normalizedName && !seenNames.has(normalizedName) && (!id || !seenIds.has(id))) {
        seenNames.add(normalizedName);
        if (id) seenIds.add(id);
        unique.push(t);
      }
    }
    return unique;
  }, [items]);

  const [index, setIndex] = useState(0);
  const total = testimonials.length;

  const move = (dir: number) => {
    if (total === 0) return;
    setIndex((prev) => (prev + dir + total) % total);
  };

  if (total === 0) return null;

  // Desktop cards (show up to 3 cards)
  const countToShow = Math.min(3, total);
  const desktopCards = Array.from({ length: countToShow }).map(
    (_, offset) => testimonials[(index + offset) % total]
  );
  const mobileCard = testimonials[index % total];

  return (
    <section id="testimonials" className="bg-[#f6f1e8] px-4 py-14 sm:px-6 sm:py-20 font-sans">
      <div className="mx-auto max-w-[1100px] text-center">
        <SectionHeading eyebrow="Testimonials" title="Loved By Our Customers" fontFamily="sans" />

        <div className="mt-8 flex items-center justify-center gap-2.5 sm:mt-10 sm:gap-4">
          {/* Previous Button */}
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={() => move(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c49a4a]/60 bg-white/60 text-[#c49a4a] shadow-sm transition hover:border-[#c49a4a] hover:bg-[#c49a4a]/10 active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Mobile View: Exactly ONE Card shown at a time */}
          <div className="w-full max-w-[340px] md:hidden">
            <article
              key={`${mobileCard?.name}-${index}`}
              className="flex min-h-[220px] flex-col justify-between rounded-xl border border-[#e4d9c7] bg-[#ffffff] px-6 py-7 text-left shadow-[0_4px_18px_rgba(72,53,35,0.06)] transition-all duration-300 animate-in fade-in zoom-in-95"
            >
              <div>
                <div className="mb-3 flex items-center text-[#c49a4a]">
                  {Array.from({ length: mobileCard?.rating || 5 }).map((_, i) => (
                    <Star key={i} size={13} className="fill-[#c49a4a]" />
                  ))}
                </div>
                <p className="font-sans text-[15px] leading-relaxed text-[#2c2823]">
                  &quot;{mobileCard?.quote}&quot;
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#76543d] text-xs font-bold text-white">
                  {mobileCard?.initials || mobileCard?.name?.charAt(0)}
                </span>
                <span className="font-sans text-sm font-semibold text-[#1a1714]">
                  {mobileCard?.name}
                </span>
              </div>
            </article>
          </div>

          {/* Desktop View (md: and up): Up to 3 Cards shown side by side */}
          <div
            className={`hidden flex-1 gap-5 md:grid ${
              countToShow === 1
                ? 'grid-cols-1 max-w-md mx-auto'
                : countToShow === 2
                ? 'grid-cols-2 max-w-2xl mx-auto'
                : 'grid-cols-3'
            }`}
          >
            {desktopCards.map((t, offset) => (
              <article
                key={`${t.name}-${index}-${offset}`}
                className="flex flex-col justify-between rounded-xl border border-[#e4d9c7] bg-[#ffffff] px-6 py-7 text-left shadow-[0_4px_18px_rgba(72,53,35,0.06)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(72,53,35,0.12)]"
              >
                <div>
                  <div className="mb-3 flex items-center text-[#c49a4a]">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <Star key={i} size={13} className="fill-[#c49a4a]" />
                    ))}
                  </div>
                  <p className="font-sans text-[14.5px] leading-relaxed text-[#2c2823]">&quot;{t.quote}&quot;</p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#76543d] text-xs font-bold text-white">
                    {t.initials || t.name.charAt(0)}
                  </span>
                  <span className="font-sans text-sm font-semibold text-[#1a1714]">{t.name}</span>
                </div>
              </article>
            ))}
          </div>

          {/* Next Button */}
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={() => move(1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c49a4a]/60 bg-white/60 text-[#c49a4a] shadow-sm transition hover:border-[#c49a4a] hover:bg-[#c49a4a]/10 active:scale-95 cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Indicator Dots */}
        {total > 1 && (
          <div className="mt-7 flex justify-center gap-1.5 sm:mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show testimonial ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? 'w-6 bg-[#b89047]' : 'w-2 bg-[#d6cbba] hover:bg-[#c49a4a]/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
