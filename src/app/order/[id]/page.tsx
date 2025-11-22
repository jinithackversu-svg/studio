'use client';

import { notFound, useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import OrderDetails from '@/components/customer/order-details';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { Order } from '@/lib/types';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const orderRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'orders', params.id);
  }, [firestore, params.id]);

  const { data: order, isLoading } = useDoc<Order>(orderRef);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading || isUserLoading) return;

    if (!order) {
        // useDoc will be null if it doesn't exist.
        // We let the component render notFound()
        setIsAuthorized(true); // Effectively, allow render to proceed to notFound
        return;
    }

    if (user && order.customerId === user.uid) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [order, user, isLoading, isUserLoading]);

  
  if (isLoading || isUserLoading || isAuthorized === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAuthorized || !order) {
    return notFound();
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container py-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">Order #{order.id}</CardTitle>
                </CardHeader>
                <CardContent>
                    <OrderDetails initialOrder={order} />
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
