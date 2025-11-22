import { Header } from '@/components/layout/header';
import { getAvailableMenuItems } from '@/app/actions';
import CustomerView from '@/components/customer/customer-view';

export default async function Home() {
  const menuItems = await getAvailableMenuItems();

  return (
    <div className="flex flex-col w-full">
      <Header />
      <main className="flex-1">
        <CustomerView menuItems={menuItems} />
      </main>
    </div>
  );
}
