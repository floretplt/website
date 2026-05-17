import { Reveal } from "@/components/animations/Reveal";

type CatalogHeroProps = {
  title: string;
  description: string;
};

export function CatalogHero({ title, description }: CatalogHeroProps) {
  return (
    <section className="border-b border-ink/10 bg-bg">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 text-center sm:px-6 sm:pb-10 sm:pt-8 md:px-10 md:pb-12 md:pt-10">
        <Reveal>
          <h1 className="h-section text-balance">{title}</h1>
        </Reveal>
        <Reveal delayMs={50}>
          <p className="text-ui-muted mx-auto mt-3 max-w-md text-balance md:mt-4">
            {description}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
