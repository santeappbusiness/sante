"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Bottom-anchored on mobile where thumbs are, a pill on desktop.
 *
 * Today sits in the middle because it is the thing people come back for, and
 * it is the only tab that changes what the product does rather than what it
 * shows.
 */

const TABS = [
  { href: "/home", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/today", label: "Today" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Profile" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-surface/95 backdrop-blur sm:static sm:mx-auto sm:mt-6 sm:max-w-3xl sm:rounded-full sm:border sm:bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-3xl">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={
                  "block py-3.5 text-center text-xs sm:text-sm sm:py-2.5 " +
                  (active ? "font-bold text-ink" : "text-slate")
                }
              >
                {tab.label}
                <span
                  aria-hidden="true"
                  className={
                    "mx-auto mt-1 block h-0.5 w-8 rounded-full " +
                    (active ? "bg-coral" : "bg-transparent")
                  }
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
