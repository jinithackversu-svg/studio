
'use client';

import { useTransition, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useDoc, useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMemoFirebase } from '@/firebase/provider';

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const router = useRouter();
  const { firestore, user, isUserLoading } = useFirebase();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const orderRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'orders', orderId);
  }, [firestore, orderId]);

  const { data: order, isLoading } = useDoc<Order>(orderRef);

  const handleConfirmPayment = () => {
    if (!order) return;
    startTransition(async () => {
      try {
        const orderDocRef = doc(firestore, 'orders', order.id);
        await updateDoc(orderDocRef, {
          status: OrderStatus.Processing,
          paymentMethod: PaymentMethod.Online,
          paymentStatus: PaymentStatus.Paid,
        });
        toast({
          title: 'Payment Successful',
          description: 'Your online payment has been confirmed.',
        });
        router.push(`/payment/${order.id}/success`);
      } catch (error) {
        console.error('Error processing online payment:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not process online payment.',
        });
      }
    });
  };

  if (isLoading || isUserLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading payment details...</div>;
  }

  if (!order) {
    return notFound();
  }

  // Security check: ensure the current user is the one who placed the order
  if (!user || user.uid !== order.customerId) {
    return notFound();
  }
  
  if (order.status !== OrderStatus.AcceptedPendingPayment) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center bg-muted/20">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Invalid Order State</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>This order is not currently awaiting payment.</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <a href={`/order/${order.id}`}>Return to Order</a>
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Confirm Your Payment</CardTitle>
            <CardDescription>Review your order and confirm payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Order Summary</h3>
              <div className="mt-2 space-y-1 text-muted-foreground text-sm">
                {order.items.map(item => (
                  <div key={item.menuItemId} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground pt-4">This is a simulated payment gateway for demonstration purposes.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleConfirmPayment} disabled={isPending}>
              {isPending ? 'Processing...' : `Pay $${order.total.toFixed(2)}`}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
