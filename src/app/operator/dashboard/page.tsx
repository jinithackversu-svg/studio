'use client';
import { getOrders } from "@/app/actions";
import { OrderQueue } from "@/components/operator/order-queue";
import { Order } from "@/lib/types";
import { useEffect, useState } from "react";

export default function OperatorDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            const fetchedOrders = await getOrders();
            setOrders(fetchedOrders);
            setLoading(false);
        }
        fetchOrders();
    }, []);

    if (loading) {
        return <div>Loading orders...</div>
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Order Dashboard</h1>
                <p className="text-muted-foreground">Manage incoming and ongoing orders.</p>
            </div>
            <OrderQueue initialOrders={orders} />
        </div>
    )
}
