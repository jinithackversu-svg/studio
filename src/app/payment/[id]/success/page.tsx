
'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Order } from '@/lib/types';
import { useMemoFirebase } from '@/firebase/provider';

export default function PaymentSuccessPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { firestore, user, isUserLoading } = useFirebase();

  const orderRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'orders', orderId);
  }, [firestore, orderId]);

  const { data: order, isLoading } = useDoc<Order>(orderRef);
  
  if (isLoading || isUserLoading) {
    return <div className="flex items-center justify-center min-h-screen">Verifying payment...</div>;
  }

  if (!order || !user || user.uid !== order.customerId) {
    return notFound();
  }


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>Your order is now being processed.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your payment for order #{order.id.substring(0, 7)} has been confirmed. You will be notified when it is ready for pickup.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/order/${order.id}`}>View Order Details</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
