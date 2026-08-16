"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExploreIcon,
  HomeIcon,
  ProfileIcon,
  ProgressIcon,
  TodayIcon,
  WeekIcon,
} from "./NavIcons";

/**
 * Navigation.
 *
 * A proper bar on mobile with real touch targets and brand icons, and a rail
 * down the left on desktop rather than the same phone bar stretched wide.
 *
 * Today is emphasised because it is the only destination that changes what the
 * product does rather than what it shows.
 */

const TABS = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/explore", label: "Explore", Icon: ExploreIcon },
  { href: "/plan", label: "Week", Icon: WeekIcon },
  { href: "/today", label: "Today", Icon: TodayIcon, primary: true },
  { href: "/progress", label: "Progress", Icon: ProgressIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

export default function AppNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile: fixed bar, thumb height, safe-area aware. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-surface/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-lg">
          {TABS.map(({ href, label, Icon, primary }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 pb-1 pt-2 " +
                    (active ? "text-ink" : "text-slate")
                  }
                >
                  <span
                    key={active ? "on" : "off"}
                    className={
                      (primary && active ? "text-coral " : "") +
                      (active ? (primary ? "nav-anim-bloom" : "nav-anim") : "")
                    }
                  >
                    <Icon active={active} size={24} />
                  </span>
                  <span className={"text-[11px] leading-none " + (active ? "font-bold" : "")}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: a rail, so wide screens stop looking like a stretched phone. */}
      <nav
        aria-label="Main"
        className="fixed left-0 top-0 z-30 hidden h-screen w-56 flex-col border-r border-ink/10 bg-surface px-4 py-7 lg:flex"
      >
        <Link href="/home" className="mb-8 block px-2">
          <img src="/brand/sante-mark.png" alt="Santé" className="w-28" />
        </Link>

        <ul className="flex flex-1 flex-col gap-1">
          {TABS.map(({ href, label, Icon, primary }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={
                    "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] transition-colors " +
                    (active
                      ? "bg-moss/25 font-bold text-ink"
                      : "text-ink-soft hover:bg-canvas hover:text-ink")
                  }
                >
                  <span
                    key={active ? "on" : "off"}
                    className={
                      (primary && active ? "text-coral " : "") +
                      (active ? (primary ? "nav-anim-bloom" : "nav-anim") : "")
                    }
                  >
                    <Icon active={active} size={22} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="px-3 text-xs leading-relaxed text-slate">
          Santé is a wellness tool, not a medical one.
        </p>
      </nav>
    </>
  );
}
