import { createClient } from "@/lib/supabase/server";
import {
  CATALOG_BROWSE_CATEGORIES,
  type ProductCategory,
} from "@/lib/constants";
import type { ProductRow } from "@/lib/types/database";

/** Bouquets + box compositions for the combined `/catalog` view. */
export async function getBrowseCatalogProducts(): Promise<ProductRow[]> {
  const chunks = await Promise.all(
    CATALOG_BROWSE_CATEGORIES.map((c) => getProductsByCategory(c)),
  );
  return chunks.flat().sort((a, b) => {
    const byCat = a.category.localeCompare(b.category);
    if (byCat !== 0) return byCat;
    return a.sort_order - b.sort_order;
  });
}

export async function getProductsByCategory(
  category: ProductCategory,
): Promise<ProductRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error(error);
      return [];
    }
    return (data ?? []) as ProductRow[];
  } catch {
    return [];
  }
}

export async function getProductBySlug(
  category: ProductCategory,
  slug: string,
): Promise<ProductRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .eq("slug", slug)
      .eq("is_available", true)
      .maybeSingle();
    if (error || !data) return null;
    return data as ProductRow;
  } catch {
    return null;
  }
}

export async function getFeaturedProducts(): Promise<ProductRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_featured", true)
      .eq("is_available", true)
      .neq("category", "wedding")
      .order("sort_order", { ascending: true })
      .limit(12);
    if (error) {
      console.error(error);
      return [];
    }
    return (data ?? []) as ProductRow[];
  } catch {
    return [];
  }
}

export async function getRelatedProducts(
  category: ProductCategory,
  excludeId: string,
  limit = 4,
): Promise<ProductRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .eq("is_available", true)
      .neq("id", excludeId)
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as ProductRow[];
  } catch {
    return [];
  }
}
