
'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
    const params = useParams<{ id: string }>();
    
    return (
        <div className="flex flex-col w-full min-h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center bg-muted/20">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                        <CardDescription>
                            Your order has been paid and is now being processed. You can track its status from your order page.
                        </CardDescription>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href={`/order/${params.id}`}>View Order Details</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
