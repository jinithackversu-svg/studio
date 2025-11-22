
'use client';

import { useState, useTransition, useMemo } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useCollection, useFirebase } from '@/firebase';
import { collection, orderBy, query, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';

export function OrderQueue() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
        startTransition(async () => {
            try {
                const orderDocRef = doc(firestore, 'orders', orderId);
                await updateDoc(orderDocRef, { status: newStatus });

                toast({ title: 'Success', description: `Order status updated.` });
            } catch (error) {
                console.error("Error updating order status:", error)
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order status.' });
            }
        });
    };

    const processedOrders = useMemo(() => {
        if (!orders) return [];
        return orders.map(order => {
            const createdAt = order.createdAt as unknown as Timestamp;
            return {
                ...order,
                createdAt: createdAt.toDate(),
            };
        });
    }, [orders]);

    const groupedOrders = useMemo(() => {
        return processedOrders.reduce((acc, order) => {
            const status = order.status;
            if (!acc[status]) {
                acc[status] = [];
            }
            acc[status].push(order);
            return acc;
        }, {} as Record<OrderStatus, Order[]>);
    }, [processedOrders]);

    const tabs = [
        OrderStatus.PaymentAwaitingAcceptance,
        OrderStatus.AcceptedPendingPayment,
        OrderStatus.Processing,
        OrderStatus.Ready,
    ];

    const OrderCard = ({ order }: { order: Order }) => (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Order #{order.id.substring(0, 7)}...</CardTitle>
                        <CardDescription>
                            {order.customerName} - {formatDistanceToNow(order.createdAt, { addSuffix: true })}
                        </CardDescription>
                    </div>
                    <Badge variant={order.paymentStatus === 'Paid' ? 'secondary' : 'outline'}>{order.paymentMethod === 'None' ? order.paymentStatus : `${order.paymentMethod} - ${order.paymentStatus}`}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                    {order.items.map(item => (
                        <li key={item.menuItemId}>{item.quantity}x {item.name}</li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                {order.status === OrderStatus.PaymentAwaitingAcceptance && (
                    <>
                        <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(order.id, OrderStatus.Rejected)} disabled={isPending}>Reject</Button>
                        <Button size="sm" onClick={() => handleUpdateStatus(order.id, OrderStatus.AcceptedPendingPayment)} disabled={isPending}>Accept</Button>
                    </>
                )}
                {order.status === OrderStatus.Processing && (
                    <Button size="sm" onClick={() => handleUpdateStatus(order.id, OrderStatus.Ready)} disabled={isPending}>Mark as Ready</Button>
                )}
                 {order.status === OrderStatus.Ready && (
                    <Button size="sm" onClick={() => handleUpdateStatus(order.id, OrderStatus.PickedUp)} disabled={isPending}>Confirm Pickup</Button>
                )}
            </CardFooter>
        </Card>
    );

    if (isLoading) {
        return <p>Loading orders...</p>
    }

    return (
        <Tabs defaultValue={OrderStatus.PaymentAwaitingAcceptance} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                {tabs.map(tab => (
                     <TabsTrigger key={tab} value={tab}>{tab} ({(groupedOrders[tab] || []).length})</TabsTrigger>
                ))}
            </TabsList>
            {tabs.map(tab => (
                <TabsContent key={tab} value={tab}>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
                        {(groupedOrders[tab] || []).map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                         {(groupedOrders[tab] || []).length === 0 && (
                            <p className="text-muted-foreground col-span-full text-center py-8">No orders in this category.</p>
                        )}
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    );
}
