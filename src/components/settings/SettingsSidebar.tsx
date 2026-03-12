"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CreditCard, Bell } from "lucide-react";

// ─────────────────────────────────────────
// SettingsSidebar — sub-navigation
// ─────────────────────────────────────────

const SETTINGS_LINKS = [
  { href: "/settings",         label: "Account",         icon: User,       exact: true },
  { href: "/settings/billing", label: "Billing & Plans", icon: CreditCard, exact: false },
  { href: "/settings/alerts",  label: "Alerts",          icon: Bell,       exact: false },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-0.5">
      {SETTINGS_LINKS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              isActive
                ? "bg-arc-500/10 text-arc-400 border border-arc-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
