'use client';

import Link from 'next/link';
import { CookingPot, LayoutDashboard, LogOut, User as UserIcon, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useUserRole } from '@/hooks/use-user-role';
import { UserRole } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


export function Header() {
  const pathname = usePathname();
  const { auth, user } = useFirebase();
  const { userProfile } = useUserRole();
  const isOperatorView = pathname.startsWith('/operator');

  const handleLogout = async () => {
    await signOut(auth);
  };
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  }


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
            {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                         <AvatarFallback>{user.displayName ? getInitials(user.displayName) : <UserIcon/>}</AvatarFallback>
                       </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     {userProfile?.role === UserRole.Operator && (
                        <DropdownMenuItem asChild>
                            <Link href="/operator/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Operator Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                     {userProfile?.role === UserRole.Customer && (
                        <DropdownMenuItem asChild>
                            <Link href="/my-orders">
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>My Orders</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                 <Button asChild variant="ghost" size="sm">
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                    </Link>
                </Button>
            )}
        </div>
      </div>
    </header>
  );
}
