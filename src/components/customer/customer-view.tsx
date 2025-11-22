
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItem, OrderItem, UserRole } from '@/lib/types';
import { placeOrder } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingCart } from 'lucide-react';
import { CartSheet } from './cart-sheet';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { useUserRole } from '@/hooks/use-user-role';

export default function CustomerView({ menuItems }: { menuItems: MenuItem[] }) {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { userProfile, isRoleLoading } = useUserRole();

  const handleAddToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(orderItem => orderItem.menuItemId === item.id);
      if (existingItem) {
        return prevCart.map(orderItem =>
          orderItem.menuItemId === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      }
      return [...prevCart, { menuItemId: item.id, name: item.name, quantity: 1, price: item.price }];
    });
    toast({
      title: 'Added to cart',
      description: `${item.name} has been added to your cart.`,
    });
  };

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.menuItemId !== menuItemId);
      }
      return prevCart.map(item =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      );
    });
  };

  const handlePlaceOrder = async () => {
    if (!user || !userProfile) {
        toast({
            variant: 'destructive',
            title: 'Not logged in',
            description: 'You must be logged in to place an order.',
        });
        router.push('/login');
        return;
    }
    if (userProfile.role !== UserRole.Customer) {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'Only customers can place orders.',
        });
        return;
    }

    try {
      const newOrder = await placeOrder(cart, user.uid, userProfile.name);
      toast({
        title: 'Order Placed!',
        description: `Your order #${newOrder.id} has been placed successfully.`,
      });
      setCart([]);
      setIsCartOpen(false);
      router.push(`/order/${newOrder.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not place order.',
      });
    }
  };

  const availableItems = menuItems.filter(item => item.isAvailable);

  if (isUserLoading || isRoleLoading) {
    return <div>Loading...</div>;
  }
  
  if (userProfile && userProfile.role === UserRole.Operator) {
    return (
        <div className="container py-8 text-center">
            <h1 className="text-2xl font-bold">Welcome, Operator!</h1>
            <p className="text-muted-foreground">You are logged in as a canteen operator.</p>
            <Button asChild className="mt-4">
                <Link href="/operator/dashboard">Go to Operator Dashboard</Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Today's Menu</h1>
        <Button onClick={() => setIsCartOpen(true)} variant="outline">
          <ShoppingCart className="mr-2 h-4 w-4" />
          View Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {availableItems.map(item => {
          const placeholder = PlaceHolderImages.find(p => p.id === item.imageId);
          return (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                {placeholder && (
                  <div className="relative aspect-[3/2] w-full mb-4">
                    <Image
                      src={placeholder.imageUrl}
                      alt={item.name}
                      fill
                      className="rounded-t-lg object-cover"
                      data-ai-hint={placeholder.imageHint}
                    />
                  </div>
                )}
                <CardTitle>{item.name}</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">${item.price.toFixed(2)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleAddToCart(item)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <CartSheet
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
}
