'use client';

import { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, CircleDashed, Clock, CookingPot, ShoppingBag, ThumbsUp, XCircle } from 'lucide-react';

const statusSteps = [
  { status: OrderStatus.PaymentAwaitingAcceptance, label: 'Awaiting Acceptance', icon: <Clock /> },
  { status: OrderStatus.AcceptedPendingPayment, label: 'Accepted', icon: <ThumbsUp /> },
  { status: OrderStatus.Processing, label: 'Processing', icon: <CookingPot /> },
  { status: OrderStatus.Ready, label: 'Ready for Pickup', icon: <ShoppingBag /> },
  { status: OrderStatus.PickedUp, label: 'Picked Up', icon: <CheckCircle /> },
];

export function OrderStatusTracker({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIndex = statusSteps.findIndex(step => step.status === currentStatus);

  if (currentStatus === OrderStatus.Rejected) {
    return (
      <div className="flex items-center justify-center p-4 rounded-lg bg-destructive/10 text-destructive">
        <XCircle className="w-6 h-6 mr-3" />
        <span className="font-semibold">Order Rejected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full p-4 overflow-x-auto">
      {statusSteps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const Icon = isCompleted ? <CheckCircle /> : isActive ? step.icon : <CircleDashed />;

        return (
          <div key={step.status} className="flex items-center">
            <div className={cn(
              "flex flex-col items-center transition-colors duration-300",
              isCompleted ? 'text-primary' : isActive ? 'text-blue-500' : 'text-muted-foreground'
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2",
                isCompleted ? 'bg-primary/10 border-primary' : isActive ? 'bg-blue-100 border-blue-500' : 'bg-muted/30 border-muted-foreground/30'
              )}>
                {Icon}
              </div>
              <p className={cn(
                "text-xs sm:text-sm text-center mt-2 font-medium",
                isActive && 'font-bold'
              )}>{step.label}</p>
            </div>

            {index < statusSteps.length - 1 && (
              <div className={cn(
                "flex-1 h-1 mx-2 sm:mx-4 transition-colors duration-500",
                isCompleted ? 'bg-primary' : 'bg-muted/50'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
