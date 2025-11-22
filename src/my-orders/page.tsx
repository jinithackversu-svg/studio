
'use client';

import { useFirebase } from '@/firebase';
import { Order } from '@/lib/types';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';

export default function MyOrdersPage() {
  const { user, firestore, isUserLoading } = useFirebase();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'orders'),
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const pageIsLoading = isUserLoading || isLoading;

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">My Orders</CardTitle>
              <CardDescription>Here is a list of your past and current orders.</CardDescription>
            </CardHeader>
            <CardContent>
              {pageIsLoading ? (
                <p>Loading your orders...</p>
              ) : !user ? (
                 <p className="text-center text-muted-foreground">Please <Link href="/login" className="text-primary underline">log in</Link> to see your orders.</p>
              ) : orders && orders.length === 0 ? (
                <p className="text-center text-muted-foreground">You haven't placed any orders yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders && orders.map(order => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Order #{order.id.substring(0, 7)}...</CardTitle>
                                <CardDescription>{format(order.createdAt, "MMMM d, yyyy 'at' h:mm a")}</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">{order.status}</p>
                            </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm text-muted-foreground">
                            {order.items.map(item => (
                                <li key={item.menuItemId}>{item.quantity}x {item.name}</li>
                            ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                          <Button asChild variant="outline">
                              <Link href={`/order/${order.id}`}>View Details</Link>
                          </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
