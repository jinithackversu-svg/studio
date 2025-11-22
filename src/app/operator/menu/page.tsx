
'use client';

import MenuTable from "@/components/operator/menu-table";

export default function MenuManagementPage() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
                <p className="text-muted-foreground">Add, edit, and manage all items on the canteen menu.</p>
            </div>
            <MenuTable />
        </div>
    );
}
