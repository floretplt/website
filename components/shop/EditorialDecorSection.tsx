"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  decorInquirySchema,
  type DecorInquiryInput,
} from "@/lib/validators";

type Props = {
  imageSrc: string;
  imageAlt: string;
};

function FieldError({
  message,
  tHome,
  tVal,
}: {
  message: string | undefined;
  tHome: (key: string) => string;
  tVal: (key: "nameRequired" | "phoneUa") => string;
}) {
  if (!message) return null;
  if (message === "decorRequestRequired") {
    return (
      <p className="text-sm text-red-800">{tHome("decorRequestRequired")}</p>
    );
  }
  if (message === "nameRequired" || message === "phoneUa") {
    return <p className="text-sm text-red-800">{tVal(message)}</p>;
  }
  return <p className="text-sm text-red-800">{message}</p>;
}

export function EditorialDecorSection({ imageSrc, imageAlt }: Props) {
  const t = useTranslations("home");
  const tVal = useTranslations("order.validation");
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DecorInquiryInput>({
    resolver: zodResolver(decorInquirySchema),
    defaultValues: {
      request: "",
      customer_name: "",
      customer_phone: "",
      contact_preference: "telegram",
    },
    mode: "onBlur",
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSent(false);
      setFormError(null);
      reset();
    }
  };

  const onSubmit = async (values: DecorInquiryInput) => {
    setFormError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/decor-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setFormError(t("decorFormError"));
        setLoading(false);
        return;
      }
      setSent(true);
      reset();
    } catch {
      setFormError(t("decorFormError"));
    } finally {
      setLoading(false);
    }
  };

  const req = (
    <span className="text-rose" aria-hidden>
      {" "}
      *
    </span>
  );

  return (
    <section className="border-t border-ink/10 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:px-10">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-bg">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width:768px) 100vw, 50vw"
          />
        </div>
        <div>
          <h2 className="h-section">{t("editorialTitle")}</h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            {t("editorialBody")}
          </p>

          <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="btn-pill mt-8 inline-flex"
              >
                {t("editorialCta")}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[100] bg-ink/40" />
              <Dialog.Content
                className="fixed left-1/2 top-1/2 z-[101] max-h-[min(90vh,720px)] w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink/10 bg-bg p-6 shadow-xl focus:outline-none"
              >
                <div className="flex items-start justify-between gap-4">
                  <Dialog.Title className="h-section text-2xl">
                    {t("decorFormTitle")}
                  </Dialog.Title>
                  <Dialog.Close
                    type="button"
                    className="rounded border border-transparent p-1 text-muted transition-colors hover:border-ink/20 hover:text-ink"
                    aria-label={t("decorFormClose")}
                  >
                    <X className="h-5 w-5" strokeWidth={1.5} />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  {t("decorFormRequest")}
                </Dialog.Description>

                {sent ? (
                  <p className="mt-8 text-base leading-relaxed text-muted">
                    {t("decorFormSuccess")}
                  </p>
                ) : (
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-8 space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="block text-sm text-muted">
                        <span className="mb-1 block uppercase tracking-wider">
                          {t("decorFormRequest")}
                          {req}
                        </span>
                        <textarea
                          rows={4}
                          className="w-full border border-ink/20 bg-transparent px-3 py-2 text-sm"
                          {...register("request")}
                        />
                      </label>
                      <FieldError
                        message={errors.request?.message}
                        tHome={t}
                        tVal={tVal}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm text-muted">
                        <span className="mb-1 block uppercase tracking-wider">
                          {t("decorFormName")}
                          {req}
                        </span>
                        <input
                          type="text"
                          autoComplete="name"
                          className="w-full border border-ink/20 bg-transparent px-3 py-2"
                          {...register("customer_name")}
                        />
                      </label>
                      <FieldError
                        message={errors.customer_name?.message}
                        tHome={t}
                        tVal={tVal}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm text-muted">
                        <span className="mb-1 block uppercase tracking-wider">
                          {t("decorFormPhone")}
                          {req}
                        </span>
                        <input
                          type="tel"
                          autoComplete="tel"
                          inputMode="tel"
                          className="w-full border border-ink/20 bg-transparent px-3 py-2"
                          {...register("customer_phone")}
                        />
                      </label>
                      <FieldError
                        message={errors.customer_phone?.message}
                        tHome={t}
                        tVal={tVal}
                      />
                    </div>

                    <fieldset>
                      <legend className="mb-3 text-sm uppercase tracking-wider text-muted">
                        {t("decorFormContactPref")}
                        {req}
                      </legend>
                      <div className="flex flex-col gap-3 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="viber"
                            {...register("contact_preference")}
                          />
                          {t("decorContactViber")}
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="telegram"
                            {...register("contact_preference")}
                          />
                          {t("decorContactTelegram")}
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="call"
                            {...register("contact_preference")}
                          />
                          {t("decorContactCall")}
                        </label>
                      </div>
                    </fieldset>

                    {formError ? (
                      <p className="text-sm text-red-800">{formError}</p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-pill w-full justify-center disabled:opacity-50"
                    >
                      {loading ? t("decorFormSending") : t("decorFormSubmit")}
                    </button>
                  </form>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </section>
  );
}
