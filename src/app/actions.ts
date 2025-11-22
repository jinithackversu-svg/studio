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
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc, 
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/firebase/server';

const app = getFirebaseAdminApp();
const firestore = getFirestore(app);

const menuItemsCollection = collection(firestore, 'menu_items');
const ordersCollection = collection(firestore, 'orders');


// --- DATA FETCHING ACTIONS ---

export async function getMenuItems(): Promise<MenuItem[]> {
  const snapshot = await getDocs(query(menuItemsCollection));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
}

export async function getAvailableMenuItems(): Promise<MenuItem[]> {
  const q = query(menuItemsCollection, where('isAvailable', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
}


export async function getOrders(): Promise<Order[]> {
    const snapshot = await getDocs(query(ordersCollection, orderBy('createdAt', 'desc')));
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
  const docRef = doc(firestore, 'orders', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
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
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(ordersCollection, newOrderData);
  const qrCodeData = await QRCode.toDataURL(docRef.id);
  await updateDoc(docRef, { qrCode: qrCodeData });
  
  revalidatePath('/operator/dashboard');
  revalidatePath('/my-orders');

  return {
    id: docRef.id,
    ...newOrderData,
    qrCode: qrCodeData,
    createdAt: newOrderData.createdAt.toDate(),
  };
}

// --- OPERATOR ACTIONS ---

export async function updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod): Promise<Order> {
  const orderRef = doc(firestore, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) {
    throw new Error('Order not found.');
  }

  const updateData: Partial<Order> = { status };

  if (paymentMethod) {
    updateData.paymentMethod = paymentMethod;
    if (paymentMethod === PaymentMethod.Online) {
        updateData.paymentStatus = PaymentStatus.Paid;
    }
  }

  // Simulate payment for cash
  if (status === OrderStatus.PickedUp && orderSnap.data().paymentMethod === PaymentMethod.Cash) {
    updateData.paymentStatus = PaymentStatus.Paid;
  }
  
  await updateDoc(orderRef, updateData);
  
  const updatedDoc = await getDoc(orderRef);
  const updatedOrderData = updatedDoc.data();
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
        const docRef = doc(firestore, 'menu_items', itemData.id);
        const { id, ...dataToUpdate } = itemData;
        await updateDoc(docRef, dataToUpdate);
        revalidatePath('/operator/menu');
        revalidatePath('/');
        return { ...itemData, id: itemData.id };
    } else {
        // Create
        const newItemData = { ...itemData };
        const docRef = await addDoc(menuItemsCollection, newItemData);
        revalidatePath('/operator/menu');
        revalidatePath('/');
        return { ...newItemData, id: docRef.id };
    }
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
    const docRef = doc(firestore, 'menu_items', id);
    await deleteDoc(docRef);
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
