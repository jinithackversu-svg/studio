'use client';

import { useState, useEffect, useTransition } from 'react';
import { Order, OrderStatus, PaymentMethod } from '@/lib/types';
import { updateOrderStatus } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusTracker } from './order-status-tracker';
import { DigitalInvoice } from './digital-invoice';

export default function OrderDetails({ initialOrder }: { initialOrder: Order }) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would be a WebSocket or SSE connection for real-time updates.
    // Here we just use the initial server-fetched data.
    setOrder(initialOrder);
  }, [initialOrder]);

  const handlePaymentSelection = (method: PaymentMethod) => {
    startTransition(async () => {
      try {
        const updatedOrder = await updateOrderStatus(order.id, OrderStatus.Processing, method);
        setOrder(updatedOrder);
        toast({
          title: 'Payment method selected',
          description: `Your order will be processed. Payment status: ${updatedOrder.paymentStatus}.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not update payment method.',
        });
      }
    });
  };

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
            <Button onClick={() => handlePaymentSelection(PaymentMethod.Online)} disabled={isPending}>
              Pay Online
            </Button>
            <Button variant="secondary" onClick={() => handlePaymentSelection(PaymentMethod.Cash)} disabled={isPending}>
              Pay with Cash at Counter
            </Button>
          </div>
        </div>
      )}

      {(order.status === OrderStatus.Ready || order.status === OrderStatus.PickedUp) && (
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
