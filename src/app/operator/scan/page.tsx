'use client';
import { getOrders } from "@/app/actions";
import { QrScanner } from "@/components/operator/qr-scanner";
import { Order } from "@/lib/types";
import { useEffect, useState } from "react";

export default function ScanPage() {
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
        return <div>Loading order data...</div>
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Scan Order QR Code</h1>
                <p className="text-muted-foreground">Scan a customer's QR code to validate their order for pickup.</p>
            </div>
            <QrScanner initialOrders={orders} />
        </div>
    )
}
