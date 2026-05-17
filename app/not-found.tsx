import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-24">
      <h1 className="h-section">Сторінку не знайдено</h1>
      <p className="mt-4 text-muted">Page not found</p>
      <Link href="/" className="btn-pill mt-8">
        На головну
      </Link>
    </div>
  );
}
