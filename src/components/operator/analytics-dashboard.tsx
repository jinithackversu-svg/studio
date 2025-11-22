
'use client';

import { useMemo } from 'react';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Skeleton } from '../ui/skeleton';

export function AnalyticsDashboard() {
  const { firestore } = useFirebase();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      where('createdAt', '<', Timestamp.fromDate(tomorrow))
    );
  }, [firestore, today, tomorrow]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

  const analyticsData = useMemo(() => {
    if (!orders) {
      return {
        totalOrders: 0,
        totalEarnings: 0,
        pendingCash: 0,
        rejectedOrders: 0,
        ordersPerHour: [],
        earningsTrend: [],
        paymentDistribution: [],
      };
    }

    const processedOrders = orders.map(order => ({
      ...order,
      createdAt: (order.createdAt as unknown as Timestamp).toDate(),
    }));

    const totalOrders = processedOrders.length;
    const totalEarnings = processedOrders
      .filter(o => o.paymentStatus === PaymentStatus.Paid)
      .reduce((sum, o) => sum + o.total, 0);
    const pendingCash = processedOrders
      .filter(o => o.paymentMethod === PaymentMethod.Cash && o.paymentStatus === PaymentStatus.Pending)
      .reduce((sum, o) => sum + o.total, 0);
    const rejectedOrders = processedOrders.filter(o => o.status === OrderStatus.Rejected).length;

    const ordersPerHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0 }));
    const earningsTrend: { hour: number; earnings: number }[] = Array.from({ length: 24 }, (_, i) => ({ hour: i, earnings: 0 }));

    processedOrders.forEach(order => {
      const hour = order.createdAt.getHours();
      ordersPerHour[hour].orders++;
      if (order.paymentStatus === PaymentStatus.Paid) {
        earningsTrend[hour].earnings += order.total;
      }
    });
    
    // Accumulate earnings over the day
    for (let i = 1; i < 24; i++) {
        earningsTrend[i].earnings += earningsTrend[i-1].earnings;
    }


    const paymentDistribution = [
      { name: 'Online', value: processedOrders.filter(o => o.paymentMethod === PaymentMethod.Online).length },
      { name: 'Cash', value: processedOrders.filter(o => o.paymentMethod === PaymentMethod.Cash).length },
    ];

    return {
      totalOrders,
      totalEarnings,
      pendingCash,
      rejectedOrders,
      ordersPerHour: ordersPerHour.map(d => ({...d, hour: `${d.hour}:00`})),
      earningsTrend: earningsTrend.map(d => ({...d, hour: `${d.hour}:00`})),
      paymentDistribution,
    };
  }, [orders]);

  const PIE_CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  if (isLoading) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-80 col-span-full lg:col-span-2" />
            <Skeleton className="h-80 col-span-full lg:col-span-2" />
            <Skeleton className="h-80 col-span-full" />
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Today's Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{analyticsData.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${analyticsData.totalEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${analyticsData.pendingCash.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rejected Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{analyticsData.rejectedOrders}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders Per Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.ordersPerHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Earnings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.earningsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" />
                </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={analyticsData.paymentDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {analyticsData.paymentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

    </div>
  );
}
