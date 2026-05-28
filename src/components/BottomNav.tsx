"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Users, ArrowLeftRight, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/inventory", icon: Package, label: "Inventory" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/trade", icon: ArrowLeftRight, label: "Trade" },
  { href: "/profile", icon: UserCircle, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]",
                active ? "text-primary-500" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
              <span className={cn("text-[10px] font-medium", active ? "font-semibold" : "")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
