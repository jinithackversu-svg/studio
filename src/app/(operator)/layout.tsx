import { Header } from '@/components/layout/header';
import { OperatorSidebar } from '@/components/layout/operator-sidebar';

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <OperatorSidebar />
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30">
            {children}
        </main>
      </div>
    </div>
  );
}
