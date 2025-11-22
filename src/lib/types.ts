export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  imageId: string;
};

export type OrderItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
};

export enum OrderStatus {
  PaymentAwaitingAcceptance = 'Payment Awaiting Acceptance',
  AcceptedPendingPayment = 'Accepted - Pending Payment',
  Processing = 'Processing',
  Ready = 'Ready',
  PickedUp = 'Picked Up',
  Rejected = 'Rejected',
}

export enum PaymentMethod {
  Online = 'Online',
  Cash = 'Cash',
  None = 'None'
}

export enum PaymentStatus {
  Paid = 'Paid',
  Pending = 'Pending',
}

export type Order = {
  id: string;
  customerName: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  qrCode: string; // Will hold a unique identifier for the QR code
  createdAt: Date;
};

export enum UserRole {
  Customer = 'Customer',
  Operator = 'Operator',
}

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
};
