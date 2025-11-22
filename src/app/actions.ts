
'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import {
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/lib/types';
import { generateDigitalInvoice } from '@/ai/flows/generate-digital-invoice';
import QRCode from 'qrcode';
import { 
  Timestamp,
  FieldValue,
} from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/firebase/server';

const app = getFirebaseAdminApp();
const firestore = getFirestore(app);

const menuItemsCollection = firestore.collection('menu_items');
const ordersCollection = firestore.collection('orders');


// --- DATA FETCHING ACTIONS ---

// Note: getMenuItems and getOrders are no longer used by the frontend,
// but are kept here for potential future server-side use.

export async function getMenuItems(): Promise<MenuItem[]> {
  const snapshot = await menuItemsCollection.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
}

export async function getOrders(): Promise<Order[]> {
    const snapshot = await ordersCollection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt as Timestamp;
        return { 
            id: doc.id,
            ...data,
            createdAt: createdAt.toDate(),
         } as Order
    });
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const docRef = firestore.collection('orders').doc(id);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data()!;
    const createdAt = data.createdAt as Timestamp;
    return {
        id: docSnap.id,
        ...data,
        createdAt: createdAt.toDate()
    } as Order;
  }
  return undefined;
}

// --- CUSTOMER ACTIONS ---

export async function placeOrder(items: OrderItem[], userId: string, customerName: string): Promise<Order> {
  if (items.length === 0) {
    throw new Error('Cart is empty.');
  }

  const newOrderData = {
    customerName: customerName,
    customerId: userId,
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: OrderStatus.PaymentAwaitingAcceptance,
    paymentMethod: PaymentMethod.None,
    paymentStatus: PaymentStatus.Pending,
    createdAt: FieldValue.serverTimestamp(),
  };

  const docRef = await ordersCollection.add(newOrderData);
  const qrCodeData = await QRCode.toDataURL(docRef.id);
  await docRef.update({ qrCode: qrCodeData });
  
  revalidatePath('/operator/dashboard');
  revalidatePath('/my-orders');

  const createdOrder = await getOrderById(docRef.id);
  if (!createdOrder) {
    throw new Error('Failed to retrieve the created order');
  }
  return createdOrder;
}

// --- OPERATOR ACTIONS ---

export async function updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod): Promise<Order> {
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
  
  const updatedDoc = await orderRef.get();
  const updatedOrderData = updatedDoc.data()!;
  const createdAt = updatedOrderData?.createdAt as Timestamp;

  const updatedOrder = { 
      id: updatedDoc.id, 
      ...updatedOrderData,
      createdAt: createdAt.toDate()
    } as Order;


  revalidatePath('/operator/dashboard');
  revalidatePath(`/order/${orderId}`);
  revalidatePath('/operator/scan');
  revalidatePath('/my-orders');

  return updatedOrder;
}

export async function upsertMenuItem(itemData: Omit<MenuItem, 'id'> & { id?: string }): Promise<MenuItem> {
    if (itemData.id) {
        // Update
        const docRef = firestore.collection('menu_items').doc(itemData.id);
        const { id, ...dataToUpdate } = itemData;
        await docRef.update(dataToUpdate);
        revalidatePath('/operator/menu');
        revalidatePath('/');
        return { ...itemData, id: itemData.id };
    } else {
        // Create
        const newItemData = { ...itemData };
        const docRef = await menuItemsCollection.add(newItemData);
        revalidatePath('/operator/menu');
        revalidatePath('/');
        return { ...newItemData, id: docRef.id };
    }
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
    const docRef = firestore.collection('menu_items').doc(id);
    await docRef.delete();
    revalidatePath('/operator/menu');
    revalidatePath('/');
    return { success: true };
}


// --- GenAI ACTION ---
export async function generateInvoiceAction(orderId: string) {
  'use server';
  const order = await getOrderById(orderId);
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
