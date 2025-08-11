
'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { Users, LayoutDashboard, DollarSign, Megaphone, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Live Users', icon: Users },
  { href: '/admin/ads', label: 'Custom Ads', icon: Megaphone },
  { href: '/admin/premium', label: 'Premium Plan', icon: DollarSign },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // If not logged in, redirect to user login. They can login as admin there.
        router.push('/login');
      } else {
        // Check if the logged-in user is the admin
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (user.email === adminEmail) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    }
  }, [user, loading, router]);


  if (loading || isAdmin === null) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      )
  }

  if (!isAdmin) {
      return (
          <div className="flex h-screen flex-col items-center justify-center gap-4">
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p>You are not authorized to view this page.</p>
              <Button onClick={() => router.push('/home')}>Go to Home</Button>
          </div>
      )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
             <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
