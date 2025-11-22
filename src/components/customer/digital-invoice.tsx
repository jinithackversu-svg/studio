'use client';

import { useState, useEffect } from 'react';
import { generateInvoiceAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Order } from '@/lib/types';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';

export function DigitalInvoice({ orderId }: { orderId: string }) {
  const [invoice, setInvoice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { firestore } = useFirebase();

  const orderRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'orders', orderId);
  }, [firestore, orderId]);

  const { data: order, isLoading: isOrderLoading } = useDoc<Order>(orderRef);

  useEffect(() => {
    if (isOrderLoading) return;
    if (!order) {
      setError('Could not load order details to generate invoice.');
      setIsLoading(false);
      return;
    }

    const getInvoice = async () => {
      try {
        // Pass only the necessary primitive data to the server action
        const result = await generateInvoiceAction({
            customerName: order.customerName,
            orderId: order.id,
            items: order.items,
            total: order.total,
            paymentMethod: order.paymentMethod,
            qrCode: order.qrCode
        });
        if (result?.invoiceText) {
          setInvoice(result.invoiceText);
        } else {
          setError('Received an empty response from the invoice generator.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    getInvoice();
  }, [order, isOrderLoading]);

  if (isLoading || isOrderLoading) {
    return (
        <Card className="bg-background/50">
            <CardContent className="p-6">
                <Skeleton className="h-6 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                <div className="flex justify-center">
                    <Skeleton className="h-32 w-32" />
                </div>
            </CardContent>
        </Card>
    )
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4 border border-destructive rounded-lg">
        <p className="font-bold">Could not generate invoice.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <Card className="bg-secondary/30">
        <CardContent className="p-6">
            <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-foreground">
                {invoice}
            </pre>
        </CardContent>
    </Card>
  );
}
