'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MenuItem } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  isAvailable: z.boolean(),
  imageId: z.string().min(1, "An image is required."),
});

type MenuFormValues = z.infer<typeof formSchema>;

interface MenuFormProps {
  item?: MenuItem;
  onFormSubmit: (item: MenuItem) => void;
}

export function MenuForm({ item, onFormSubmit }: MenuFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: item || {
      name: '',
      description: '',
      price: 0,
      isAvailable: true,
      imageId: '',
    },
  });

  const onSubmit = (values: MenuFormValues) => {
    startTransition(async () => {
      try {
        const { id, ...dataToSave } = values;
        let savedItem: MenuItem;
        
        if (id) {
          // Update existing item
          const docRef = doc(firestore, 'menu_items', id);
          await setDoc(docRef, dataToSave, { merge: true });
          savedItem = { id, ...dataToSave };
        } else {
          // Create new item
          const collectionRef = collection(firestore, 'menu_items');
          const docRef = await addDoc(collectionRef, dataToSave);
          savedItem = { id: docRef.id, ...dataToSave };
        }
        
        toast({ title: 'Success', description: `Menu item ${item ? 'updated' : 'created'}.` });
        onFormSubmit(savedItem);

      } catch (error) {
        console.error("Error saving menu item:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not save menu item. Check console for details.' });
      }
    });
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{item ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
        <DialogDescription>
          {item ? 'Update the details for this item.' : 'Fill out the details for the new item.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Margherita Pizza" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="A short description of the item..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="8.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="imageId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a display image" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PlaceHolderImages.filter(p => p.id !== 'qr-code').map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Available for Order
                  </FormLabel>
                  <FormDescription>
                    If unchecked, this item will not be visible to customers.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
