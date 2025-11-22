
'use client';

import { OrderQueue } from "@/components/operator/order-queue";

export default function OperatorDashboard() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Order Dashboard</h1>
                <p className="text-muted-foreground">Manage incoming and ongoing orders.</p>
            </div>
            <OrderQueue />
        </div>
    )
}
