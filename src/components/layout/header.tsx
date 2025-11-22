'use client';

import Link from 'next/link';
import { CookingPot, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const isOperatorView = pathname.startsWith('/operator');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <CookingPot className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-lg">CanteenConnect</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <Button
              variant={isOperatorView ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link href="/operator/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Operator View
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
