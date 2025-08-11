
'use client';

import { ReactNode } from 'react';
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
import { usePathname } from 'next/navigation';
import { Users, LayoutDashboard, DollarSign, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Live Users', icon: Users },
  { href: '/admin/ads', label: 'Custom Ads', icon: Megaphone },
  { href: '/admin/premium', label: 'Premium Plan', icon: DollarSign },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Basic admin protection - replace with a proper role-based system
  // For now, let's assume the first user is the admin. This is NOT secure for production.
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (!isAdmin) {
      return (
          <div className="flex h-screen items-center justify-center">
              <p>You are not authorized to view this page.</p>
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
