
'use client';

import { useTransition } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useDoc, useFirebase } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Loader2 } from 'lucide-react';

export default function PaymentPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { firestore } = useFirebase();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const orderRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'orders', params.id);
    }, [firestore, params.id]);

    const { data: order, isLoading } = useDoc<Order>(orderRef);

    const handlePayment = () => {
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
                    description: 'Your payment has been processed.',
                });
                
                router.push(`/payment/${order.id}/success`);

            } catch (error) {
                console.error("Error processing payment:", error);
                toast({
                    variant: 'destructive',
                    title: 'Payment Failed',
                    description: 'There was an error processing your payment.',
                });
            }
        });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading payment gateway...</div>;
    }

    if (!order) {
        return notFound();
    }
    
    if (order.status !== OrderStatus.AcceptedPendingPayment) {
        return (
            <div className="flex flex-col w-full min-h-screen">
              <Header />
              <main className="flex-1 flex items-center justify-center bg-muted/20">
                <Card className="max-w-md mx-auto text-center">
                    <CardHeader>
                        <CardTitle>Payment Not Required</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>This order does not currently require payment or has already been paid.</p>
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
        <div className="flex flex-col w-full min-h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center bg-muted/20">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Complete Your Payment</CardTitle>
                        <CardDescription>
                            Order #{order.id.substring(0, 7)}... for a total of <strong>${order.total.toFixed(2)}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input id="cardNumber" placeholder="**** **** **** 1234" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expiry">Expiry</Label>
                                <Input id="expiry" placeholder="MM/YY" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cvc">CVC</Label>
                                <Input id="cvc" placeholder="123" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zip">ZIP</Label>
                                <Input id="zip" placeholder="12345" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handlePayment} disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <CreditCard className="mr-2 h-4 w-4" />
                            )}
                            Pay ${order.total.toFixed(2)}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
