'use server';

import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/lib/types';
import { mockMenuItems, mockOrders } from '@/lib/data';
import { generateDigitalInvoice } from '@/ai/flows/generate-digital-invoice';
import QRCode from 'qrcode';

// In-memory data stores (for simulation purposes)
let menuItems: MenuItem[] = [...mockMenuItems];
let orders: Order[] = [...mockOrders];

// --- DATA FETCHING ACTIONS ---

export async function getMenuItems(): Promise<MenuItem[]> {
  // In a real app, you'd fetch this from a database.
  return Promise.resolve(menuItems);
}

export async function getAvailableMenuItems(): Promise<MenuItem[]> {
  return Promise.resolve(menuItems.filter(item => item.isAvailable));
}


export async function getOrders(): Promise<Order[]> {
  return Promise.resolve(orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  return Promise.resolve(orders.find(order => order.id === id));
}

// --- CUSTOMER ACTIONS ---

export async function placeOrder(items: OrderItem[]): Promise<Order> {
  if (items.length === 0) {
    throw new Error('Cart is empty.');
  }

  const orderId = `ORD${(orders.length + 1).toString().padStart(3, '0')}`;
  const qrCodeData = await QRCode.toDataURL(orderId);

  const newOrder: Order = {
    id: orderId,
    customerName: 'Guest User', // In a real app, this would come from session
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: OrderStatus.PaymentAwaitingAcceptance,
    paymentMethod: PaymentMethod.None,
    paymentStatus: PaymentStatus.Pending,
    qrCode: qrCodeData,
    createdAt: new Date(),
  };

  orders.push(newOrder);
  revalidatePath('/operator/dashboard');
  
  return newOrder;
}

// --- OPERATOR ACTIONS ---

export async function updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod): Promise<Order> {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error('Order not found.');
  }

  orders[orderIndex].status = status;

  if (paymentMethod) {
    orders[orderIndex].paymentMethod = paymentMethod;
    if (paymentMethod === PaymentMethod.Online) {
        orders[orderIndex].paymentStatus = PaymentStatus.Paid;
    }
  }

  // Simulate payment for cash
  if (status === OrderStatus.PickedUp && orders[orderIndex].paymentMethod === PaymentMethod.Cash) {
    orders[orderIndex].paymentStatus = PaymentStatus.Paid;
  }

  revalidatePath('/operator/dashboard');
  revalidatePath(`/order/${orderId}`);
  revalidatePath('/operator/scan');

  return orders[orderIndex];
}

export async function upsertMenuItem(itemData: Omit<MenuItem, 'id'> & { id?: string }): Promise<MenuItem> {
    if (itemData.id) {
        // Update
        const index = menuItems.findIndex(item => item.id === itemData.id);
        if (index === -1) throw new Error('Menu item not found');
        menuItems[index] = { ...menuItems[index], ...itemData };
        revalidatePath('/operator/menu');
        revalidatePath('/');
        return menuItems[index];
    } else {
        // Create
        const newItem: MenuItem = {
            ...itemData,
            id: `ITEM${menuItems.length + 1}`,
        };
        menuItems.push(newItem);
        revalidatePath('/operator/menu');
        revalidatePath('/');
        return newItem;
    }
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
    const initialLength = menuItems.length;
    menuItems = menuItems.filter(item => item.id !== id);
    if(menuItems.length === initialLength) {
        throw new Error('Menu item not found');
    }
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