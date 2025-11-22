
'use client';

import { useTransition } from 'react';
import { Order, OrderStatus, PaymentMethod } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusTracker } from './order-status-tracker';
import { DigitalInvoice } from './digital-invoice';
import Image from 'next/image';
import { useDoc, useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { useRouter } from 'next/navigation';

export default function OrderDetails({ initialOrder }: { initialOrder: Order }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const router = useRouter();

  const orderRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'orders', initialOrder.id);
  }, [firestore, initialOrder.id]);

  const { data: order, isLoading } = useDoc<Order>(orderRef);

  const handleCashPaymentSelection = () => {
    if (!order) return;
    startTransition(async () => {
      try {
        const orderDocRef = doc(firestore, 'orders', order.id);
        await updateDoc(orderDocRef, {
            status: OrderStatus.Processing,
            paymentMethod: PaymentMethod.Cash
        });

        toast({
          title: 'Payment method selected',
          description: `You've chosen to pay with cash. Your order will now be processed.`,
        });
      } catch (error) {
        console.error("Error updating order status:", error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not update payment method.',
        });
      }
    });
  };
  
  if (isLoading) {
    return <p>Loading order details...</p>
  }
  
  if (!order) {
    return <p>Order not found.</p>
  }

  const showQrCode = order.status === OrderStatus.Ready || order.status === OrderStatus.PickedUp;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Order Status</h3>
        <OrderStatusTracker currentStatus={order.status} />
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Order Summary</h3>
        <div className="mt-2 space-y-2 text-muted-foreground">
          {order.items.map(item => (
            <div key={item.menuItemId} className="flex justify-between">
              <span>{item.name} x {item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>
      
      {order.status === OrderStatus.AcceptedPendingPayment && (
        <div className="p-4 bg-accent/50 rounded-lg text-center space-y-4">
          <h3 className="text-lg font-semibold text-accent-foreground">Choose Your Payment Method</h3>
          <p className="text-muted-foreground">Your order has been accepted! Please select a payment option.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => router.push(`/payment/${order.id}`)} disabled={isPending}>
              Pay Online
            </Button>
            <Button variant="secondary" onClick={handleCashPaymentSelection} disabled={isPending}>
              Pay with Cash at Counter
            </Button>
          </div>
        </div>
      )}

      {showQrCode && (
        <div>
          <Separator className="my-6" />
          <h3 className="text-xl font-bold mb-4 text-center">Scan at Counter for Pickup</h3>
           <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <Image
                  src={order.qrCode}
                  alt={`QR Code for order ${order.id}`}
                  width={200}
                  height={200}
                />
              </div>
              <p className="text-muted-foreground text-sm">Show this QR code to the operator</p>
           </div>
        </div>
      )}
      
      {order.status === OrderStatus.PickedUp && (
        <div>
          <Separator className="my-6" />
          <h3 className="text-xl font-bold mb-4 text-center">Your Digital Invoice</h3>
          <DigitalInvoice orderId={order.id} />
        </div>
      )}

      {order.status === OrderStatus.Rejected && (
        <div className="p-4 bg-destructive/20 text-destructive-foreground rounded-lg text-center">
            <h3 className="text-lg font-semibold">Order Rejected</h3>
            <p>We are sorry, but your order could not be processed at this time.</p>
        </div>
      )}
    </div>
  );
}
