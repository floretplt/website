"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Props = {
  /** All image URLs to show in the lightbox (first is also the thumbnail). */
  images: string[];
  alt: string;
  sizes: string;
  aspectClassName: string;
  quality?: number;
  priority?: boolean;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  imgClassName?: string;
  /** Navigates to this path instead of opening the lightbox (e.g. product page from a card). */
  linkHref?: string;
  /**
   * When false, renders only the thumbnail (no lightbox). Use under a card-level link overlay.
   * @default true
   */
  enableLightbox?: boolean;
};

export function ProductImageLightbox({
  images,
  alt,
  sizes,
  aspectClassName,
  quality = 75,
  priority,
  loading,
  fetchPriority,
  imgClassName,
  linkHref,
  enableLightbox = true,
}: Props) {
  const t = useTranslations("product");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const main = images[0];

  const current = images[idx] ?? main;
  const hasNav = images.length > 1;

  const go = (delta: number) => {
    setIdx((i) => {
      const next = i + delta;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  };

  if (!main) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center bg-bg text-xs uppercase tracking-widest text-muted",
          aspectClassName,
        )}
      >
        Floret
      </div>
    );
  }

  const imageClasses = cn(
    "object-cover transition-opacity duration-200 group-hover:opacity-95",
    imgClassName ?? "",
  );

  if (linkHref) {
    return (
      <Link
        href={linkHref}
        className={cn(
          "group relative block w-full cursor-pointer overflow-hidden bg-bg outline-none ring-ink focus-visible:ring-2",
          aspectClassName,
        )}
        aria-label={alt}
      >
        <Image
          src={main}
          alt={alt}
          fill
          className={imageClasses}
          sizes={sizes}
          quality={quality}
          priority={priority}
          loading={loading}
          fetchPriority={fetchPriority}
        />
      </Link>
    );
  }

  if (!enableLightbox) {
    return (
      <div
        className={cn(
          "relative block w-full overflow-hidden bg-bg",
          aspectClassName,
        )}
      >
        <Image
          src={main}
          alt={alt}
          fill
          className={cn("object-cover", imgClassName ?? "")}
          sizes={sizes}
          quality={quality}
          priority={priority}
          loading={loading}
          fetchPriority={fetchPriority}
        />
      </div>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={cn(
            "group relative block w-full cursor-zoom-in overflow-hidden bg-bg outline-none ring-ink focus-visible:ring-2",
            aspectClassName,
          )}
          aria-label={t("lightboxZoom")}
        >
          <Image
            src={main}
            alt={alt}
            fill
            className={imageClasses}
            sizes={sizes}
            quality={quality}
            priority={priority}
            loading={loading}
            fetchPriority={fetchPriority}
          />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-ink/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-0 z-[201] flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          aria-describedby={undefined}
        >
          <div className="relative flex min-h-0 flex-1 flex-col p-4 pt-14 md:p-8 md:pt-16">
            <Dialog.Title className="sr-only">{alt}</Dialog.Title>
            <Dialog.Close
              className="absolute right-4 top-4 rounded-full border border-bg/20 bg-bg/10 p-2 text-bg transition-colors hover:bg-bg/20"
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
