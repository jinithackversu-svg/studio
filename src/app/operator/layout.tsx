'use client';

import { Header } from '@/components/layout/header';
import { OperatorSidebar } from '@/components/layout/operator-sidebar';
import { useUserRole } from '@/hooks/use-user-role';
import { UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, isRoleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!isRoleLoading && (!userProfile || userProfile.role !== UserRole.Operator)) {
      router.replace('/'); // or a dedicated '/unauthorized' page
    }
  }, [userProfile, isRoleLoading, router]);

  if (isRoleLoading || !userProfile || userProfile.role !== UserRole.Operator) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Loading or checking permissions...</p>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <OperatorSidebar />
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30">
            {children}
        </main>
      </div>
    </div>
  );
}
