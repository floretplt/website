"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  images: string[];
  productName: string;
};

/** Product page gallery: large frame + thumbs; tap opens fullscreen zoom with navigation. */
export function ProductDetailGallery({ images, productName }: Props) {
  const t = useTranslations("product");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const main = images[0];
  const hasNav = images.length > 1;
  const current = images[idx] ?? main;

  const openAt = (i: number) => {
    setIdx(i);
    setOpen(true);
  };

  const go = (delta: number) => {
    setIdx((i) => {
      const next = i + delta;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="space-y-4">
        <div className="relative mx-auto w-full max-w-xl md:mx-0">
          <div className="relative h-[min(58vh,560px)] w-full sm:h-[min(52vh,520px)] md:h-[min(62vh,640px)]">
            {main ? (
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="relative block h-full w-full cursor-zoom-in outline-none ring-ink focus-visible:ring-2"
                  aria-label={t("lightboxZoom")}
                  onClick={() => setIdx(0)}
                >
                  <Image
                    src={main}
                    alt={productName}
                    fill
                    className="object-contain object-center"
                    priority
                    sizes="(max-width:768px) 100vw, 45vw"
                  />
                </button>
              </Dialog.Trigger>
            ) : null}
          </div>
        </div>

        {images.length > 1 ? (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((src, i) => {
              const realIndex = i + 1;
              return (
                <button
                  key={src + i}
                  type="button"
                  className="relative aspect-square overflow-hidden bg-bg outline-none ring-ink focus-visible:ring-2"
                  aria-label={t("lightboxZoom")}
                  onClick={() => openAt(realIndex)}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 22vw, 112px"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-ink/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-[201] flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          aria-describedby={undefined}
        >
          <div className="relative flex min-h-0 flex-1 flex-col p-4 pt-14 md:p-8 md:pt-16">
            <Dialog.Title className="sr-only">{productName}</Dialog.Title>
            <Dialog.Close
              className="absolute right-4 top-4 z-10 rounded-full border border-bg/20 bg-bg/10 p-2 text-bg transition-colors hover:bg-bg/20"
              aria-label={t("lightboxClose")}
            >
              <X className="h-5 w-5" />
            </Dialog.Close>

            <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center">
              {current ? (
                <div className="relative h-[min(85vh,900px)] w-full">
                  <Image
                    src={current}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="100vw"
                    quality={90}
                    priority
                  />
                </div>
              ) : null}
            </div>

            {hasNav ? (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-bg/20 bg-bg/10 p-2 text-bg md:left-6"
                  aria-label="Previous"
                  onClick={() => go(-1)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-bg/20 bg-bg/10 p-2 text-bg md:right-6"
                  aria-label="Next"
                  onClick={() => go(1)}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <p className="mt-2 text-center text-xs text-bg/70">
                  {idx + 1} / {images.length}
                </p>
              </>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
