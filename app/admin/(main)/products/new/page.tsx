import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← До товарів
        </Link>
        <PageHeader
          title="Новий товар"
          description="Заповніть основну інформацію, ціни та додайте фото."
        />
      </div>
      <ProductForm />
    </div>
  );
}
