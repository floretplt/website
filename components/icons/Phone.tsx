export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5.5 4.5c0-.55.45-1 1-1h2.4c.45 0 .85.3.97.74l1.05 3.7c.11.4-.03.83-.36 1.08l-1.6 1.2a13 13 0 0 0 5.82 5.82l1.2-1.6c.25-.33.68-.47 1.08-.36l3.7 1.05c.44.12.74.52.74.97v2.4c0 .55-.45 1-1 1h-1.5C10.6 19.5 4.5 13.4 4.5 6v-1.5Z" />
    </svg>
  );
}
