import { getOrderById } from '@/app/actions';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import OrderDetails from '@/components/customer/order-details';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);

  if (!order) {
    notFound();
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
