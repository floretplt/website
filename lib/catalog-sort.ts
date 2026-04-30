import type { ProductRow } from "@/lib/types/database";

/** Client-visible ordering; default preserves server/query order. */
export function sortCatalogProducts(
  products: ProductRow[],
  sort: string | undefined,
): ProductRow[] {
  const arr = [...products];
  if (sort === "popular") {
    arr.sort((a, b) => {
      if (a.is_featured !== b.is_featured) {
        return Number(b.is_featured) - Number(a.is_featured);
      }
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.slug.localeCompare(b.slug);
    });
  }
  return arr;
}
