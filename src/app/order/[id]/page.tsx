'use client';

import { getOrderById } from '@/app/actions';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import OrderDetails from '@/components/customer/order-details';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { Order } from '@/lib/types';

export default function OrderPage({ params }: { params: { id: string } }) {
  const { user, isUserLoading } = useUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;

    const fetchOrder = async () => {
      const fetchedOrder = await getOrderById(params.id);
      if (!fetchedOrder) {
        notFound();
      }

      // Security check: ensure the logged-in user owns this order
      if (user && fetchedOrder.customerId !== user.uid) {
         notFound(); // Or show an access denied page
      }
      
      setOrder(fetchedOrder);
      setLoading(false);
    };

    fetchOrder();
  }, [params.id, user, isUserLoading]);
  
  if (loading) {
    return <div>Loading...</div>
  }

  if (!order) {
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
