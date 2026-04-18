import { CategoryTabs } from "@/components/shop/CategoryTabs";

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CategoryTabs />
      {children}
    </>
  );
}
