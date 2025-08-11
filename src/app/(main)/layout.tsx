import { BottomNavbar } from '@/components/bottom-navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNavbar />
    </div>
  );
}
