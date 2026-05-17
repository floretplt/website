"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  IconDashboard,
  IconExternal,
  IconLogout,
  IconMenu,
  IconOrders,
  IconProducts,
  IconSettings,
  IconX,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { size?: number; className?: string }) => React.JSX.Element;
  matchPrefix?: string;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Огляд", icon: IconDashboard },
  {
    href: "/admin/orders",
    label: "Замовлення",
    icon: IconOrders,
    matchPrefix: "/admin/orders",
  },
  {
    href: "/admin/products",
    label: "Товари",
    icon: IconProducts,
    matchPrefix: "/admin/products",
  },
  {
    href: "/admin/settings",
    label: "Налаштування",
    icon: IconSettings,
    matchPrefix: "/admin/settings",
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix);
  return pathname === item.href;
}

export function AdminShell({
  children,
  signOutAction,
}: {
  children: React.ReactNode;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname() ?? "/admin";
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Mobile topbar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-xs font-semibold text-white">
            F
          </span>
          <span className="text-sm font-semibold tracking-tight">FLORET</span>
        </Link>
        <button
          type="button"
          aria-label="Меню"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        >
          {open ? <IconX size={18} /> : <IconMenu size={18} />}
        </button>
      </div>

      <div className="lg:flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white lg:sticky lg:top-0 lg:block lg:h-screen">
          <SidebarContent
            pathname={pathname}
            signOutAction={signOutAction}
          />
        </aside>

        {/* Mobile drawer */}
        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] border-r border-zinc-200 bg-white shadow-xl">
              <SidebarContent
                pathname={pathname}
                signOutAction={signOutAction}
                onNavigate={() => setOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  signOutAction,
  onNavigate,
}: {
  pathname: string;
  signOutAction: () => Promise<void>;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="hidden items-center gap-2 px-5 py-5 lg:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white">
          F
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">FLORET</span>
          <span className="text-[11px] text-zinc-500">Панель керування</span>
        </div>
      </div>
      <div className="lg:hidden h-1" />

      <nav className="flex-1 space-y-1 px-3 py-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-zinc-100 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 admin-body text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <IconExternal size={16} />
          <span>На сайт</span>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 admin-body text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <IconLogout size={16} />
            <span>Вийти</span>
          </button>
        </form>
      </div>
    </div>
  );
}
