import { getMenuItems } from "@/app/actions";
import MenuTable from "@/components/operator/menu-table";

export default async function MenuManagementPage() {
    const menuItems = await getMenuItems();

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
                <p className="text-muted-foreground">Add, edit, and manage all items on the canteen menu.</p>
            </div>
            <MenuTable initialItems={menuItems} />
        </div>
    );
}
