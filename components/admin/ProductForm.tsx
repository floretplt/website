"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveProduct } from "@/lib/actions/products-crud";
import { ADMIN_CATEGORY_LABEL } from "@/lib/admin/category-labels";
import { COLOR_MOODS, PRODUCT_CATEGORIES } from "@/lib/constants";
import type { ProductRow } from "@/lib/types/database";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  Switch,
  Textarea,
} from "./ui";
import { IconImage, IconTrash, IconUpload, IconX } from "./icons";
import { cn } from "@/lib/utils";

type Props = {
  product?: ProductRow | null;
};

const MOOD_LABEL: Record<string, string> = {
  pink: "Рожевий",
  blue: "Блакитний",
  yellow: "Жовтий",
  red: "Червоний",
  white: "Білий",
  bright: "Яскравий",
};

function optPrice(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/products/${path}`;
}

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragMain, setDragMain] = useState(false);
  const [dragExtra, setDragExtra] = useState(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(
    Boolean(product?.is_featured),
  );

  useEffect(() => {
    if (product?.is_available === false) setIsFeatured(false);
  }, [product?.is_available]);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  const [mainPath, setMainPath] = useState<string | null>(
    product?.image_url?.trim() || null,
  );
  const [extraPaths, setExtraPaths] = useState<string[]>(() => {
    const imgs = (product?.images as string[] | null) ?? [];
    const main = product?.image_url?.trim();
    return imgs.filter((p) => p && p !== main);
  });

  const mainPreview = useMemo(() => publicImageUrl(mainPath), [mainPath]);

  async function uploadFile(file: File, slot: "main" | "extra") {
    setUploading(true);
    setError(null);
    try {
      const safe = file.name.replace(/[^\w.\-]+/g, "_") || "photo.jpg";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("filename", `${Date.now()}-${safe}`);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : "Не вдалося завантажити файл",
        );
      }
      const path = json.path as string | undefined;
      if (!path) throw new Error("Немає шляху файлу");
      if (slot === "main") setMainPath(path);
      else setExtraPaths((prev) => [...prev, path]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  }

  const handleFiles = async (files: FileList | null, slot: "main" | "extra") => {
    if (!files?.length) return;
    if (slot === "main") {
      await uploadFile(files[0]!, "main");
    } else {
      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i]!, "extra");
      }
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const nameUk = String(fd.get("name_uk")).trim();
    const descRaw = String(fd.get("description_uk") ?? "").trim();

    let image_url: string | null = mainPath;
    let images = [...extraPaths];
    if (!image_url && images.length > 0) {
      image_url = images[0] ?? null;
      images = images.slice(1);
    }

    const payload = {
      name_uk: nameUk,
      name_en: nameUk,
      description_uk: descRaw || null,
      description_en: descRaw || null,
      category: String(fd.get("category")),
      color_mood: String(fd.get("color_mood")),
      price_uah_small: optPrice(fd, "price_uah_small"),
      price_uah_medium: optPrice(fd, "price_uah_medium"),
      price_uah_large: optPrice(fd, "price_uah_large"),
      images,
      image_url,
      is_featured: product?.is_available === false ? false : isFeatured,
      sort_order: Number(fd.get("sort_order") ?? 0),
    };

    try {
      await saveProduct(payload, product?.id);
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Основна інформація"
              description="Посилання в каталозі створюється автоматично з назви."
            />
            <CardBody className="space-y-4">
              <Field label="Назва" required>
                <Input
                  name="name_uk"
                  required
                  defaultValue={product?.name_uk}
                  placeholder="Напр.: Ранковий туман"
                />
              </Field>
              <Field
                label="Опис"
                hint="Короткий опис — 1–2 речення про настрій чи склад."
              >
                <Textarea
                  name="description_uk"
                  rows={3}
                  defaultValue={product?.description_uk ?? ""}
                  placeholder="Що особливого в цьому букеті?"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Категорія">
                  <Select name="category" defaultValue={product?.category}>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {ADMIN_CATEGORY_LABEL[c] ?? c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Настрій кольору">
                  <Select name="color_mood" defaultValue={product?.color_mood}>
                    {COLOR_MOODS.map((m) => (
                      <option key={m} value={m}>
                        {MOOD_LABEL[m] ?? m}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Ціни"
              description="Заповніть лише ті розміри, які продаєте (наприклад, лише S і M). Євро перераховується з гривні. Потрібен хоча б один розмір."
            />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="S (малий), ₴" hint="Залиште порожнім, якщо немає">
                  <Input
                    name="price_uah_small"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={
                      product?.price_uah_small != null
                        ? String(product.price_uah_small)
                        : ""
                    }
                  />
                </Field>
                <Field label="M (середній), ₴" hint="Залиште порожнім, якщо немає">
                  <Input
                    name="price_uah_medium"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={
                      product?.price_uah_medium != null
                        ? String(product.price_uah_medium)
                        : ""
                    }
                  />
                </Field>
                <Field label="L (великий), ₴" hint="Залиште порожнім, якщо немає">
                  <Input
                    name="price_uah_large"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue={
                      product?.price_uah_large != null
                        ? String(product.price_uah_large)
                        : ""
                    }
                  />
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Фото"
              description="Перше фото — головне. Додаткові кадри показуються в картці товару."
            />
            <CardBody className="space-y-6">
              <div>
                <span className="mb-2 block admin-label">
                  Головне фото
                </span>
                {mainPreview ? (
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mainPreview}
                      alt=""
                      className="h-32 w-32 rounded-lg border border-zinc-200 object-cover"
                    />
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => mainInputRef.current?.click()}
                      >
                        <IconUpload size={14} />
                        Замінити
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setMainPath(null)}
                      >
                        <IconTrash size={14} />
                        Прибрати
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => mainInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragMain(true);
                    }}
                    onDragLeave={() => setDragMain(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragMain(false);
                      void handleFiles(e.dataTransfer.files, "main");
                    }}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed bg-zinc-50/60 px-4 py-8 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-50",
                      dragMain
                        ? "border-zinc-900 bg-zinc-100"
                        : "border-zinc-200",
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm">
                      <IconUpload size={16} />
                    </span>
                    <span className="admin-label">
                      Перетягніть фото сюди або натисніть
                    </span>
                    <span className="admin-meta">
                      PNG, JPG, WEBP до 10 МБ
                    </span>
                  </button>
                )}
                <input
                  ref={mainInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading || loading}
                  onChange={(ev) => {
                    const f = ev.target.files?.[0];
                    ev.target.value = "";
                    if (f) void uploadFile(f, "main");
                  }}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="block admin-label">
                    Додаткові фото
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => extraInputRef.current?.click()}
                  >
                    <IconUpload size={14} />
                    Додати
                  </Button>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragExtra(true);
                  }}
                  onDragLeave={() => setDragExtra(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragExtra(false);
                    void handleFiles(e.dataTransfer.files, "extra");
                  }}
                  className={cn(
                    "rounded-lg border-2 border-dashed p-3 transition-colors",
                    dragExtra
                      ? "border-zinc-900 bg-zinc-50"
                      : extraPaths.length === 0
                        ? "border-zinc-200 bg-zinc-50/60"
                        : "border-transparent",
                  )}
                >
                  {extraPaths.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1 py-6 text-center admin-meta">
                      <IconImage size={18} />
                      <span>Перетягніть сюди додаткові фото</span>
                    </div>
                  ) : (
                    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {extraPaths.map((p) => {
                        const url = publicImageUrl(p);
                        return (
                          <li
                            key={p}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
                          >
                            {url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] text-zinc-500">
                                {p}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setExtraPaths((prev) =>
                                  prev.filter((x) => x !== p),
                                )
                              }
                              aria-label="Видалити фото"
                              className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-zinc-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white"
                            >
                              <IconX size={12} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <input
                  ref={extraInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={uploading || loading}
                  onChange={(ev) => {
                    const files = ev.target.files;
                    ev.target.value = "";
                    void handleFiles(files, "extra");
                  }}
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Публікація" />
            <CardBody className="space-y-5">
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2">
                <div>
                  <p className="admin-label">
                    На головній
                  </p>
                  <p className="admin-meta">
                    Товар потрапить у добірку.
                  </p>
                </div>
                <Switch
                  checked={isFeatured}
                  onChange={setIsFeatured}
                  name="is_featured"
                  disabled={product?.is_available === false}
                />
              </div>

              <Field
                label="Порядок у списку"
                hint="Менше число — вище в списку."
              >
                <Input
                  name="sort_order"
                  type="number"
                  defaultValue={product?.sort_order ?? 0}
                />
              </Field>
            </CardBody>
          </Card>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 admin-meta">
            Євро в магазині перераховується з гривні. Мінімальна сума замовлення
            для цього стилю — не нижче за найменшу вказану ціну розміру.
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
        {uploading ? (
          <span className="mr-auto admin-meta">
            Завантаження фото…
          </span>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={loading}
        >
          Скасувати
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {loading ? "Збереження…" : "Зберегти"}
        </Button>
      </div>
    </form>
  );
}
