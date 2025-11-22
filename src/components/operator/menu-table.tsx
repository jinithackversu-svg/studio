
'use client';

import { useState, useTransition } from 'react';
import { MenuItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { MenuForm } from './menu-form';
import { useToast } from '@/hooks/use-toast';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCollection, useFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';

export default function MenuTable() {
    const [isPending, startTransition] = useTransition();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | undefined>(undefined);
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const menuItemsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'menu_items');
    }, [firestore]);

    const { data: items, isLoading } = useCollection<MenuItem>(menuItemsQuery);

    const handleToggleAvailability = (item: MenuItem) => {
        startTransition(async () => {
            try {
                const docRef = doc(firestore, 'menu_items', item.id);
                await updateDoc(docRef, { isAvailable: !item.isAvailable });
                toast({ title: 'Success', description: 'Availability updated.' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not update item availability.' });
            }
        });
    };

    const handleFormSubmit = (item: MenuItem) => {
        setIsFormOpen(false);
        setSelectedItem(undefined);
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            try {
                const docRef = doc(firestore, 'menu_items', id);
                await deleteDoc(docRef);
                toast({ title: 'Success', description: 'Menu item deleted.' });
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not delete menu item.' });
            }
        });
    }

    if (isLoading) {
        return <p>Loading menu...</p>;
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setSelectedItem(undefined)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </DialogTrigger>
                    <MenuForm 
                        item={selectedItem} 
                        onFormSubmit={handleFormSubmit}
                    />
                </Dialog>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Availability</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items && items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>${item.price.toFixed(2)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={item.isAvailable}
                                            onCheckedChange={() => handleToggleAvailability(item)}
                                            disabled={isPending}
                                            aria-label="Toggle item availability"
                                        />
                                        <Badge variant={item.isAvailable ? 'secondary' : 'outline'}>
                                            {item.isAvailable ? 'Available' : 'Unavailable'}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setIsFormOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the menu item.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(item.id)} disabled={isPending}>
                                                    Delete
                                                </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {(!items || items.length === 0) && <p className="text-center p-4 text-muted-foreground">No menu items found.</p>}
            </div>
        </div>
    );
}
