import { MenuItem, Order, OrderStatus, PaymentMethod, PaymentStatus } from './types';

export const mockMenuItems: MenuItem[] = [
  { id: '1', name: 'Margherita Pizza', description: 'Classic pizza with tomato, mozzarella, and basil.', price: 12.99, isAvailable: true, imageId: 'pizza' },
  { id: '2', name: 'Cheeseburger', description: 'Beef patty with cheese, lettuce, and tomato.', price: 8.99, isAvailable: true, imageId: 'burger' },
  { id: '3', name: 'Caesar Salad', description: 'Fresh romaine lettuce with Caesar dressing.', price: 7.50, isAvailable: true, imageId: 'salad' },
  { id: '4', name: 'Spaghetti Bolognese', description: 'Pasta with a rich meat sauce.', price: 11.50, isAvailable: false, imageId: 'pasta' },
  { id: '5', name: 'Club Sandwich', description: 'Triple-decker with turkey, bacon, and lettuce.', price: 9.99, isAvailable: true, imageId: 'sandwich' },
  { id: '6', name: 'Latte', description: 'Espresso with steamed milk.', price: 4.50, isAvailable: true, imageId: 'coffee' },
];

export const mockOrders: Order[] = [
    {
        id: 'ORD001',
        customerName: 'John Doe',
        items: [
            { menuItemId: '2', name: 'Cheeseburger', quantity: 2, price: 8.99 },
            { menuItemId: '6', name: 'Latte', quantity: 1, price: 4.50 },
        ],
        total: 22.48,
        status: OrderStatus.PaymentAwaitingAcceptance,
        paymentMethod: PaymentMethod.None,
        paymentStatus: PaymentStatus.Pending,
        qrCode: 'qr_ord001',
        createdAt: new Date(Date.now() - 3600000 * 0.1),
    },
    {
        id: 'ORD002',
        customerName: 'Jane Smith',
        items: [
            { menuItemId: '3', name: 'Caesar Salad', quantity: 1, price: 7.50 },
        ],
        total: 7.50,
        status: OrderStatus.AcceptedPendingPayment,
        paymentMethod: PaymentMethod.None,
        paymentStatus: PaymentStatus.Pending,
        qrCode: 'qr_ord002',
        createdAt: new Date(Date.now() - 3600000 * 0.2),
    },
    {
        id: 'ORD003',
        customerName: 'Peter Jones',
        items: [
            { menuItemId: '1', name: 'Margherita Pizza', quantity: 1, price: 12.99 },
        ],
        total: 12.99,
        status: OrderStatus.Processing,
        paymentMethod: PaymentMethod.Online,
        paymentStatus: PaymentStatus.Paid,
        qrCode: 'qr_ord003',
        createdAt: new Date(Date.now() - 3600000 * 0.5),
    },
    {
        id: 'ORD004',
        customerName: 'Mary Brown',
        items: [
            { menuItemId: '5', name: 'Club Sandwich', quantity: 1, price: 9.99 },
        ],
        total: 9.99,
        status: OrderStatus.Ready,
        paymentMethod: PaymentMethod.Cash,
        paymentStatus: PaymentStatus.Pending,
        qrCode: 'qr_ord004',
        createdAt: new Date(Date.now() - 3600000 * 1),
    },
    {
        id: 'ORD005',
        customerName: 'Chris Green',
        items: [
            { menuItemId: '2', name: 'Cheeseburger', quantity: 1, price: 8.99 },
        ],
        total: 8.99,
        status: OrderStatus.PickedUp,
        paymentMethod: PaymentMethod.Online,
        paymentStatus: PaymentStatus.Paid,
        qrCode: 'qr_ord005',
        createdAt: new Date(Date.now() - 3600000 * 2),
    },
];
