'use client';

import { useState, useTransition, useMemo } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { updateOrderStatus } from '@/app/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function OrderQueue({ initialOrders }: { initialOrders: Order[] }) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
        startTransition(async () => {
            try {
                const updatedOrder = await updateOrderStatus(orderId, newStatus);
                setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
                toast({ title: 'Success', description: `Order #${orderId} moved to ${newStatus}.` });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order status.' });
            }
        });
    };

    const groupedOrders = useMemo(() => {
        return orders.reduce((acc, order) => {
            const status = order.status;
            if (!acc[status]) {
                acc[status] = [];
            }
            acc[status].push(order);
            return acc;
        }, {} as Record<OrderStatus, Order[]>);
    }, [orders]);

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
                        <CardTitle>Order #{order.id}</CardTitle>
                        <CardDescription>
                            {order.customerName} - {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
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
