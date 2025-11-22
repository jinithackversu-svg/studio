
'use client';

import { Header } from '@/components/layout/header';
import CustomerView from '@/components/customer/customer-view';
import { useCollection, useFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { MenuItem } from '@/lib/types';
import { useMemoFirebase } from '@/firebase/provider';

export default function Home() {
  const { firestore } = useFirebase();

  const menuItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'menu_items');
  }, [firestore]);

  const { data: menuItems, isLoading } = useCollection<MenuItem>(menuItemsQuery);

  if (isLoading) {
    return (
        <div className="flex flex-col w-full">
            <Header />
            <main className="flex-1 container py-8">
                <p>Loading menu...</p>
            </main>
        </div>
    )
  }

  const availableItems = menuItems?.filter(item => item.isAvailable) ?? [];

  return (
    <div className="flex flex-col w-full">
      <Header />
      <main className="flex-1">
        <CustomerView menuItems={availableItems} />
      </main>
    </div>
  );
}
