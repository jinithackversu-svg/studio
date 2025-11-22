
'use server';

import { notFound } from 'next/navigation';
import {
  Order,
} from '@/lib/types';
import { generateDigitalInvoice } from '@/ai/flows/generate-digital-invoice';

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
