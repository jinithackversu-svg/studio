'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, QrCode } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
    { href: '/operator/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/operator/menu', icon: UtensilsCrossed, label: 'Menu Items' },
    { href: '/operator/scan', icon: QrCode, label: 'Scan QR Code' },
];

export function OperatorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r bg-background md:flex md:flex-col">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider>
            {navItems.map((item) => (
                <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                    <Link
                    href={item.href}
                    className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                        pathname.startsWith(item.href) && "bg-accent text-accent-foreground"
                    )}
                    >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
            ))}
            </TooltipProvider>
        </nav>
    </aside>
  );
}
