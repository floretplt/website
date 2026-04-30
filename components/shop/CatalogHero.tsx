import { Reveal } from "@/components/animations/Reveal";

type CatalogHeroProps = {
  title: string;
  description: string;
};

export function CatalogHero({ title, description }: CatalogHeroProps) {
  return (
    <section className="border-b border-ink/10 bg-gradient-to-b from-[#FAFAF8] via-bg to-bg">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-2 sm:px-6 sm:pb-8 sm:pt-3 md:px-10 md:pb-9 md:pt-4">
        <div className="max-w-2xl">
          <Reveal>
            <h1 className="h-section text-balance">{title}</h1>
          </Reveal>
          <Reveal delayMs={50}>
            <p className="mt-3 text-base leading-relaxed text-muted md:mt-4 md:text-[15px] md:leading-relaxed">
              {description}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
