'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import jsQR from 'jsqr';
import { Order, OrderStatus } from '@/lib/types';
import { updateOrderStatus } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function QrScanner({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [scannedOrderId, setScannedOrderId] = useState<string | null>(null);
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to scan QR codes.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);

  useEffect(() => {
    let animationFrameId: number;
    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data !== scannedOrderId) {
            setScannedOrderId(code.data);
            const foundOrder = orders.find(o => o.id === code.data);
            setScannedOrder(foundOrder || null);
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    if (hasCameraPermission && !scannedOrder) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hasCameraPermission, orders, scannedOrder, scannedOrderId]);
  
  const handleConfirmPickup = () => {
    if (!scannedOrder) return;
    
    startTransition(async () => {
        try {
            const updatedOrder = await updateOrderStatus(scannedOrder.id, OrderStatus.PickedUp);
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            setScannedOrder(updatedOrder);
            toast({
                title: 'Pickup Confirmed',
                description: `Order #${scannedOrder.id} has been marked as picked up.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not confirm pickup.',
            });
        }
    });
  };
  
  const handleReset = () => {
    setScannedOrderId(null);
    setScannedOrder(null);
  }

  return (
    <Card>
      <CardContent className="p-6">
        {scannedOrder ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Order Details</h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Order #{scannedOrder.id}</span>
                  <Badge variant={scannedOrder.status === 'Picked Up' ? 'default' : 'secondary'}>{scannedOrder.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div>
                    <p className="font-semibold">Customer:</p>
                    <p>{scannedOrder.customerName}</p>
                 </div>
                 <div>
                    <p className="font-semibold">Items:</p>
                    <ul className="list-disc list-inside">
                        {scannedOrder.items.map(item => (
                            <li key={item.menuItemId}>{item.quantity}x {item.name}</li>
                        ))}
                    </ul>
                 </div>
                 <div>
                    <p className="font-semibold">Total:</p>
                    <p>${scannedOrder.total.toFixed(2)}</p>
                 </div>
                 <div>
                    <p className="font-semibold">Payment:</p>
                    <p>{scannedOrder.paymentMethod} - <span className={scannedOrder.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}>{scannedOrder.paymentStatus}</span></p>
                 </div>
                 <div>
                    <p className="font-semibold">Ordered At:</p>
                    <p>{format(new Date(scannedOrder.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
                 </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-4">
                  <Button variant="outline" onClick={handleReset}>Scan Another</Button>
                  {scannedOrder.status === OrderStatus.Ready && (
                      <Button onClick={handleConfirmPickup} disabled={isPending}>
                          {isPending ? 'Confirming...' : 'Confirm Pickup'}
                      </Button>
                  )}
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="relative">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            
            {hasCameraPermission === false && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access in your browser to use this feature.
                </AlertDescription>
              </Alert>
            )}

            {scannedOrderId && !scannedOrder && (
                 <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Order Not Found</AlertTitle>
                    <AlertDescription>
                        The scanned QR code does not correspond to a valid order.
                         <Button variant="link" onClick={handleReset}>Try again</Button>
                    </AlertDescription>
                </Alert>
            )}
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-primary/50 rounded-lg shadow-lg" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
