import { getOrders } from "@/app/actions";
import { QrScanner } from "@/components/operator/qr-scanner";

export default async function ScanPage() {
    const orders = await getOrders();
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