import { getOrders } from "@/app/actions";
import { OrderQueue } from "@/components/operator/order-queue";

export default async function OperatorDashboard() {
    const orders = await getOrders();

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
