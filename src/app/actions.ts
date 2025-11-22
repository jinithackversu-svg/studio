
'use server';

import { notFound } from 'next/navigation';
import {
  OrderItem,
  PaymentMethod,
} from '@/lib/types';
import { generateDigitalInvoice } from '@/ai/flows/generate-digital-invoice';

type GenerateInvoiceActionInput = {
    customerName: string;
    orderId: string;
    items: OrderItem[];
    total: number;
    paymentMethod: PaymentMethod;
    qrCode: string;
}

// --- GenAI ACTION ---
export async function generateInvoiceAction(input: GenerateInvoiceActionInput) {
  'use server';
  if (!input) {
    notFound();
  }

  const { customerName, orderId, items, total, paymentMethod, qrCode } = input;

  const flowInput = {
    customerName,
    orderId,
    orderItems: items.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
    totalAmount: total,
    paymentMethod: paymentMethod,
    qrCodeDataUri: qrCode,
  };

  try {
    const result = await generateDigitalInvoice(flowInput);
    return result;
  } catch (error) {
    console.error('Error generating digital invoice:', error);
    throw new Error('Failed to generate digital invoice.');
  }
}
