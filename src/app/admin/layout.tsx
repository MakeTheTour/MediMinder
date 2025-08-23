
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
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { Users, LayoutDashboard, DollarSign, Megaphone, CreditCard, User, LogOut, Mail, ChevronDown, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Live Users', icon: Users },
  { href: '/admin/ads', label: 'Custom Ads', icon: Megaphone },
  { href: '/admin/premium', label: 'Premium Plan', icon: DollarSign },
  { href: '/admin/email', label: 'Email Settings', icon: Mail },
  { href: '/admin/settings', label: 'API Settings', icon: KeyRound },
  { href: '/admin/profile', label: 'Profile', icon: User },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') {
        setIsAdmin(true); // Allow login page to render
        return;
    }
    if (!loading) {
      if (!user) {
        router.push('/admin/login');
      } else {
        if (user.email === 'admin@mediminder.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    }
  }, [user, loading, router, pathname]);
  
  const handleSignOut = async () => {
    await logout();
    router.push('/admin/login');
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

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
                <Collapsible>
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip='Payments'>
                                <CreditCard/>
                                <span>Payments</span>
                                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                    </SidebarMenuItem>

                    <CollapsibleContent asChild>
                        <SidebarMenuSub>
                            <SidebarMenuSubItem>
                                <Link href="/admin/subscriptions">
                                    <SidebarMenuSubButton isActive={pathname === '/admin/subscriptions'}>
                                        Subscriptions
                                    </SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                                <Link href="/admin/payments">
                                    <SidebarMenuSubButton isActive={pathname === '/admin/payments'}>
                                        Gateways Setting
                                    </SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuSubItem>
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarMenu>
          </SidebarContent>
           <SidebarFooter>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-grow flex flex-col overflow-auto">
             <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
