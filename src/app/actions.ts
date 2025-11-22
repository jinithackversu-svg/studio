
'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/lib/types';
import { generateDigitalInvoice } from '@/ai/flows/generate-digital-invoice';
import { 
  getFirestore
} from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/firebase/server';

const app = getFirebaseAdminApp();
const firestore = getFirestore(app);

// --- OPERATOR ACTIONS ---

export async function updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod): Promise<void> {
  const orderRef = firestore.collection('orders').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new Error('Order not found.');
  }

  const updateData: {[key: string]: any} = { status };

  if (paymentMethod) {
    updateData.paymentMethod = paymentMethod;
    if (paymentMethod === PaymentMethod.Online) {
        updateData.paymentStatus = PaymentStatus.Paid;
    }
  }

  // Simulate payment for cash
  if (status === OrderStatus.PickedUp && orderSnap.data()!.paymentMethod === PaymentMethod.Cash) {
    updateData.paymentStatus = PaymentStatus.Paid;
  }
  
  await orderRef.update(updateData);

  revalidatePath('/operator/dashboard');
  revalidatePath(`/order/${orderId}`);
  revalidatePath('/operator/scan');
  revalidatePath('/my-orders');
}

// --- GenAI ACTION ---
export async function generateInvoiceAction(order: Order) {
  'use server';
  if (!order) {
    notFound();
  }

  const qrCodeDataUri = order.qrCode;

  const input = {
    customerName: order.customerName,
    orderId: order.id,
    orderItems: order.items.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
    totalAmount: order.total,
    paymentMethod: order.paymentMethod,
    qrCodeDataUri,
  };

  try {
    const result = await generateDigitalInvoice(input);
    return result;
  } catch (error) {
    console.error('Error generating digital invoice:', error);
    throw new Error('Failed to generate digital invoice.');
  }
}
